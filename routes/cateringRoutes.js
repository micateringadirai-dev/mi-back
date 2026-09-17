const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const CateringEvent = require('../models/CateringEvent');
const CateringOrder = require('../models/CateringOrder');
const CateringGallery = require('../models/CateringGallery');
const sendEmail = require('../utils/sendEmail');
const { exportToExcel, exportCateringPrepExcel } = require('../utils/exportExcel');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* ---------------------------- PUBLIC ROUTES ---------------------------- */

// GET /api/catering/events - list active/upcoming catering events for the quotation picker
router.get(
  '/events',
  asyncHandler(async (req, res) => {
    const events = await CateringEvent.find({ isActive: true }).sort({ eventDate: 1 });
    res.json({ success: true, data: events });
  })
);

// GET /api/catering/gallery - public: list active food gallery photos ("What We Cook")
router.get(
  '/gallery',
  asyncHandler(async (req, res) => {
    const items = await CateringGallery.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

// POST /api/catering/orders - customer submits a quotation/order request
router.post(
  '/orders',
  [
    body('itemName').notEmpty().withMessage('Item name is required'),
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('mobileNumber').isLength({ min: 10 }).withMessage('Valid 10-digit mobile number required'),
    body('numberOfPackets').isInt({ min: 1 }).withMessage('Minimum 1 packet is required'),
    body('orderDate').isISO8601().withMessage('Valid order date is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join(', '));
    }

    const deliveryType = req.body.deliveryType === 'Self Service' ? 'Self Service' : 'Delivery';
    let address = req.body.address ? req.body.address.trim() : '';

    if (deliveryType === 'Delivery' && !address) {
      res.status(400);
      throw new Error('Delivery address is required for doorstep delivery');
    }

    if (deliveryType === 'Self Service' && !address) {
      address = 'Self Service / Kitchen Pickup (M I CATERING SERVICE, KALLUKOLLAI, Adirampattinam - 614701)';
    }

    const orderType = req.body.orderType || (req.body.event ? 'pre-order' : 'quotation');
    const numberOfPackets = Number(req.body.numberOfPackets) || 1;
    const unitPrice = Number(req.body.unitPrice) || 0;
    const portionUnit = req.body.portionUnit || 'Packet';

    // Calculate subtotal from items and add-ons
    let extrasTotal = 0;
    if (Array.isArray(req.body.selectedExtras)) {
      extrasTotal = req.body.selectedExtras.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );
    }
    const computedSubtotal = (unitPrice * numberOfPackets) + extrasTotal;
    const subtotalAmount = Number(req.body.subtotalAmount) || computedSubtotal || Number(req.body.estimatedAmount) || 0;

    // Calculate promotional discount
    const discountType = req.body.discountType || 'none';
    const discountValue = Number(req.body.discountValue) || 0;
    let discountAmount = 0;
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = Math.round((subtotalAmount * discountValue) / 100);
    } else if (discountType === 'flat' && discountValue > 0) {
      discountAmount = Math.min(subtotalAmount, discountValue);
    }
    const finalAmount = Math.max(0, subtotalAmount - discountAmount);

    const order = await CateringOrder.create({
      ...req.body,
      orderType,
      numberOfPackets,
      unitPrice,
      portionUnit,
      subtotalAmount,
      discountType,
      discountValue,
      discountAmount,
      finalAmount,
      estimatedAmount: finalAmount || subtotalAmount,
      deliveryType,
      address,
    });

    const extrasText =
      Array.isArray(order.selectedExtras) && order.selectedExtras.length > 0
        ? order.selectedExtras
            .map((e) => `${e.name}${e.portion ? ` (${e.portion})` : ''} × ${e.quantity || 1} (₹${(e.price || 0) * (e.quantity || 1)})`)
            .join(', ')
        : 'None';

    const discountText =
      order.discountAmount > 0
        ? `<p><b>Promotional Discount (${order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat'}):</b> <strong style="color:#b22222;">-₹${order.discountAmount}</strong></p>`
        : '';

    sendEmail({
      subject: `New Catering ${order.orderType === 'pre-order' ? 'Pre-Order' : 'Quotation'} [${order.deliveryType}] - ${order.itemName} (${order.customerName})`,
      html: `
        <h2>New Catering ${order.orderType === 'pre-order' ? 'Pre-Order' : 'Quotation'} Received</h2>
        <p><b>Order Type:</b> <strong>${order.orderType === 'pre-order' ? '🔥 Dynamic Pre-Order' : '📋 Event Quotation'}</strong></p>
        <p><b>Fulfillment Mode:</b> <strong style="color:${order.deliveryType === 'Delivery' ? '#1b6223' : '#b25e00'};">${order.deliveryType === 'Delivery' ? '🚚 Doorstep Delivery' : '🛍️ Self Service (Kitchen Pickup)'}</strong></p>
        <p><b>Item / Event:</b> ${order.itemName} (${order.portionUnit || 'Packet'})</p>
        <p><b>Customer:</b> ${order.customerName}</p>
        <p><b>Mobile:</b> ${order.mobileNumber}</p>
        <p><b>Quantity:</b> ${order.numberOfPackets} ${order.portionUnit || 'Packets'}${order.unitPrice > 0 ? ` @ ₹${order.unitPrice} each` : ''}</p>
        <p><b>Order / Event Date:</b> ${new Date(order.orderDate).toDateString()}</p>
        <p><b>${order.deliveryType === 'Delivery' ? 'Delivery Address' : 'Pickup / Location Notes'}:</b> ${order.address}</p>
        <p><b>Extra Side Dishes:</b> ${extrasText}</p>
        ${order.subtotalAmount > 0 ? `<p><b>Original Subtotal:</b> ₹${order.subtotalAmount}</p>` : ''}
        ${discountText}
        <p><b>Final Payable Total:</b> <strong style="color:#1b6223; font-size:1.15em;">₹${order.finalAmount || order.estimatedAmount || 0}</strong></p>
        <p><b>Food Requirements:</b> ${order.foodRequirements || '-'}</p>
        <p><b>Additional Notes:</b> ${order.additionalNotes || '-'}</p>
      `,
    });

    res.status(201).json({ success: true, data: order });
  })
);

/* ----------------------------- ADMIN ROUTES ----------------------------- */
router.use('/admin', protect);

/* ---- Gallery CRUD (Admin) ---- */

// GET /api/catering/admin/gallery
router.get(
  '/admin/gallery',
  asyncHandler(async (req, res) => {
    const items = await CateringGallery.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

// POST /api/catering/admin/gallery
router.post(
  '/admin/gallery',
  asyncHandler(async (req, res) => {
    const { name, imageUrl, description, order, isActive } = req.body;
    if (!name || !imageUrl) {
      res.status(400);
      throw new Error('Dish name and image are required');
    }
    const item = await CateringGallery.create({ name, imageUrl, description, order: order || 0, isActive: isActive !== false });
    res.status(201).json({ success: true, data: item });
  })
);

// PUT /api/catering/admin/gallery/:id
router.put(
  '/admin/gallery/:id',
  asyncHandler(async (req, res) => {
    const item = await CateringGallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      res.status(404);
      throw new Error('Gallery item not found');
    }
    res.json({ success: true, data: item });
  })
);

// DELETE /api/catering/admin/gallery/:id
router.delete(
  '/admin/gallery/:id',
  asyncHandler(async (req, res) => {
    await CateringGallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gallery item deleted' });
  })
);

// Events CRUD
router.post(
  '/admin/events',
  asyncHandler(async (req, res) => {
    const event = await CateringEvent.create(req.body);
    res.status(201).json({ success: true, data: event });
  })
);

router.get(
  '/admin/events',
  asyncHandler(async (req, res) => {
    const events = await CateringEvent.find().sort({ eventDate: -1 });
    res.json({ success: true, data: events });
  })
);

router.put(
  '/admin/events/:id',
  asyncHandler(async (req, res) => {
    const event = await CateringEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    res.json({ success: true, data: event });
  })
);

router.delete(
  '/admin/events/:id',
  asyncHandler(async (req, res) => {
    await CateringEvent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  })
);

// Orders: list with date/status/search/deliveryType/orderType filters
router.get(
  '/admin/orders',
  asyncHandler(async (req, res) => {
    const { date, status, search, from, to, deliveryType, orderType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (deliveryType && deliveryType !== 'all') {
      filter.deliveryType = deliveryType === 'Delivery' ? { $ne: 'Self Service' } : deliveryType;
    }
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.orderDate = { $gte: d, $lt: next };
    } else if (from && to) {
      filter.orderDate = { $gte: new Date(from), $lte: new Date(to) };
    }
    if (search) {
      filter.$or = [
        { customerName: new RegExp(search, 'i') },
        { mobileNumber: new RegExp(search, 'i') },
        { itemName: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
      ];
    }
    const orders = await CateringOrder.find(filter).sort({ orderDate: 1 });
    res.json({ success: true, data: orders });
  })
);

router.get(
  '/admin/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await CateringOrder.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json({ success: true, data: order });
  })
);

router.patch(
  '/admin/orders/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await CateringOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json({ success: true, data: order });
  })
);

router.delete(
  '/admin/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await CateringOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json({ success: true, message: 'Order request deleted successfully' });
  })
);

// Excel export - date-specific kitchen prep review or standard order manifest
router.get(
  '/admin/orders/export/excel',
  asyncHandler(async (req, res) => {
    const { date, from, to, status, search, deliveryType, orderType, itemName, mode, format } = req.query;
    const isCsv = format === 'csv';
    const filter = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (itemName) filter.itemName = new RegExp(itemName, 'i');
    if (deliveryType && deliveryType !== 'all') {
      filter.deliveryType = deliveryType === 'Delivery' ? { $ne: 'Self Service' } : deliveryType;
    }
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.orderDate = { $gte: d, $lt: next };
    } else if (from && to) {
      filter.orderDate = { $gte: new Date(from), $lte: new Date(to) };
    }
    if (search) {
      filter.$or = [
        { customerName: new RegExp(search, 'i') },
        { mobileNumber: new RegExp(search, 'i') },
        { itemName: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
      ];
    }

    const orders = await CateringOrder.find(filter).sort({ orderDate: 1 }).lean();

    // If prep mode or date specified, generate comprehensive kitchen prep review
    if (mode === 'prep' || date) {
      const filename = `kitchen-prep-review-${date || 'all'}.${isCsv ? 'csv' : 'xlsx'}`;
      return await exportCateringPrepExcel(res, filename, date, orders, isCsv ? 'csv' : 'xlsx');
    }

    const rows = orders.map((o) => ({
      orderRef: `#${(o._id || '').toString().slice(-6).toUpperCase()}`,
      orderType: o.orderType === 'quotation' ? 'Quotation' : 'Pre-Order',
      itemName: o.itemName,
      portionUnit: o.portionUnit || 'Packet',
      deliveryType: o.deliveryType || 'Delivery',
      customerName: o.customerName,
      mobileNumber: o.mobileNumber,
      numberOfPackets: o.numberOfPackets,
      extraSideDishes:
        Array.isArray(o.selectedExtras) && o.selectedExtras.length > 0
          ? o.selectedExtras.map((e) => `${e.name}${e.portion ? ` (${e.portion})` : ''} (${e.quantity || 1})`).join(', ')
          : '-',
      subtotalAmount: o.subtotalAmount ? `₹${o.subtotalAmount}` : (o.estimatedAmount ? `₹${o.estimatedAmount}` : '-'),
      discountAmount: o.discountAmount > 0 ? `-₹${o.discountAmount}` : '-',
      finalAmount: o.finalAmount ? `₹${o.finalAmount}` : (o.estimatedAmount ? `₹${o.estimatedAmount}` : '-'),
      orderDate: new Date(o.orderDate).toDateString(),
      address: o.address || '-',
      foodRequirements: o.foodRequirements || '-',
      additionalNotes: o.additionalNotes || '-',
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleString(),
    }));

    await exportToExcel(
      res,
      `catering-orders-${deliveryType ? deliveryType.toLowerCase().replace(/\s+/g, '-') + '-' : ''}${date || 'all'}.${isCsv ? 'csv' : 'xlsx'}`,
      [
        { header: 'Order Ref', key: 'orderRef', width: 14 },
        { header: 'Order Type', key: 'orderType', width: 14 },
        { header: 'Item / Event', key: 'itemName', width: 22 },
        { header: 'Portion Unit', key: 'portionUnit', width: 16 },
        { header: 'Delivery Mode', key: 'deliveryType', width: 16 },
        { header: 'Customer Name', key: 'customerName', width: 18 },
        { header: 'Mobile', key: 'mobileNumber', width: 15 },
        { header: 'Packets', key: 'numberOfPackets', width: 12 },
        { header: 'Extra Side Dishes', key: 'extraSideDishes', width: 25 },
        { header: 'Subtotal', key: 'subtotalAmount', width: 14 },
        { header: 'Discount', key: 'discountAmount', width: 14 },
        { header: 'Final Total', key: 'finalAmount', width: 15 },
        { header: 'Order Date', key: 'orderDate', width: 15 },
        { header: 'Address / Pickup Location', key: 'address', width: 35 },
        { header: 'Food Requirements', key: 'foodRequirements', width: 25 },
        { header: 'Notes', key: 'additionalNotes', width: 25 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Submitted At', key: 'createdAt', width: 22 },
      ],
      rows,
      isCsv ? 'csv' : 'xlsx'
    );
  })
);

module.exports = router;
