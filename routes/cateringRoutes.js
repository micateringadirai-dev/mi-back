const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const CateringEvent = require('../models/CateringEvent');
const CateringOrder = require('../models/CateringOrder');
const sendEmail = require('../utils/sendEmail');
const exportToExcel = require('../utils/exportExcel');
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

// POST /api/catering/orders - customer submits a quotation/order request
router.post(
  '/orders',
  [
    body('itemName').notEmpty(),
    body('customerName').notEmpty(),
    body('mobileNumber').isLength({ min: 10 }),
    body('numberOfPackets').isInt({ min: 1 }),
    body('orderDate').isISO8601(),
    body('address').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join(', '));
    }

    const order = await CateringOrder.create(req.body);

    sendEmail({
      subject: `New Catering Order - ${order.itemName} (${order.customerName})`,
      html: `
        <h2>New Catering Order Received</h2>
        <p><b>Item/Event:</b> ${order.itemName}</p>
        <p><b>Customer:</b> ${order.customerName}</p>
        <p><b>Mobile:</b> ${order.mobileNumber}</p>
        <p><b>Packets/Persons:</b> ${order.numberOfPackets}</p>
        <p><b>Order Date:</b> ${new Date(order.orderDate).toDateString()}</p>
        <p><b>Address:</b> ${order.address}</p>
        <p><b>Food Requirements:</b> ${order.foodRequirements || '-'}</p>
        <p><b>Additional Notes:</b> ${order.additionalNotes || '-'}</p>
      `,
    });

    res.status(201).json({ success: true, data: order });
  })
);

/* ----------------------------- ADMIN ROUTES ----------------------------- */
router.use('/admin', protect);

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

// Orders: list with date/status/search filters
router.get(
  '/admin/orders',
  asyncHandler(async (req, res) => {
    const { date, status, search, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
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

// Excel export - filterable by date/event/status via query params
router.get(
  '/admin/orders/export/excel',
  asyncHandler(async (req, res) => {
    const { date, status, itemName } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (itemName) filter.itemName = itemName;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.orderDate = { $gte: d, $lt: next };
    }

    const orders = await CateringOrder.find(filter).sort({ orderDate: 1 }).lean();

    const rows = orders.map((o) => ({
      itemName: o.itemName,
      customerName: o.customerName,
      mobileNumber: o.mobileNumber,
      numberOfPackets: o.numberOfPackets,
      orderDate: new Date(o.orderDate).toDateString(),
      address: o.address,
      foodRequirements: o.foodRequirements,
      additionalNotes: o.additionalNotes,
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleString(),
    }));

    await exportToExcel(
      res,
      `catering-orders-${date || 'all'}.xlsx`,
      [
        { header: 'Item / Event', key: 'itemName' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Mobile', key: 'mobileNumber' },
        { header: 'Packets', key: 'numberOfPackets', width: 12 },
        { header: 'Order Date', key: 'orderDate' },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Food Requirements', key: 'foodRequirements', width: 25 },
        { header: 'Notes', key: 'additionalNotes', width: 25 },
        { header: 'Status', key: 'status' },
        { header: 'Submitted At', key: 'createdAt', width: 22 },
      ],
      rows
    );
  })
);

module.exports = router;
