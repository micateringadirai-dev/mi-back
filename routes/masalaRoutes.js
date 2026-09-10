const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const MasalaProduct = require('../models/MasalaProduct');
const MasalaEnquiry = require('../models/MasalaEnquiry');
const sendEmail = require('../utils/sendEmail');
const exportToExcel = require('../utils/exportExcel');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* PUBLIC */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const products = await MasalaProduct.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: products });
  })
);

router.post(
  '/enquiries',
  [
    body('productName').notEmpty(),
    body('quantityKg').isFloat({ min: 0.5 }),
    body('customerName').notEmpty(),
    body('phoneNumber').isLength({ min: 10 }),
    body('address').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array().map((e) => e.msg).join(', '));
    }
    const enquiry = await MasalaEnquiry.create(req.body);

    sendEmail({
      subject: `New Masala Enquiry - ${enquiry.productName} (${enquiry.customerName})`,
      html: `
        <h2>New Ibrahim Masala Mill Enquiry</h2>
        <p><b>Product:</b> ${enquiry.productName}</p>
        <p><b>Quantity:</b> ${enquiry.quantityKg} kg</p>
        <p><b>Customer:</b> ${enquiry.customerName}</p>
        <p><b>Phone:</b> ${enquiry.phoneNumber}</p>
        <p><b>Address:</b> ${enquiry.address}</p>
        <p><b>Message:</b> ${enquiry.message || '-'}</p>
      `,
    });

    res.status(201).json({ success: true, data: enquiry });
  })
);

/* ADMIN */
router.use('/admin', protect);

router.post(
  '/admin/products',
  asyncHandler(async (req, res) => {
    const product = await MasalaProduct.create(req.body);
    res.status(201).json({ success: true, data: product });
  })
);

router.get(
  '/admin/products',
  asyncHandler(async (req, res) => {
    const products = await MasalaProduct.find().sort({ name: 1 });
    res.json({ success: true, data: products });
  })
);

router.put(
  '/admin/products/:id',
  asyncHandler(async (req, res) => {
    const product = await MasalaProduct.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: product });
  })
);

router.delete(
  '/admin/products/:id',
  asyncHandler(async (req, res) => {
    await MasalaProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  })
);

router.get(
  '/admin/enquiries',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: new RegExp(search, 'i') },
        { phoneNumber: new RegExp(search, 'i') },
        { productName: new RegExp(search, 'i') },
      ];
    }
    const enquiries = await MasalaEnquiry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: enquiries });
  })
);

router.patch(
  '/admin/enquiries/:id/status',
  asyncHandler(async (req, res) => {
    const enquiry = await MasalaEnquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: enquiry });
  })
);

router.get(
  '/admin/enquiries/export/excel',
  asyncHandler(async (req, res) => {
    const enquiries = await MasalaEnquiry.find().sort({ createdAt: -1 }).lean();
    const rows = enquiries.map((e) => ({
      productName: e.productName,
      quantityKg: e.quantityKg,
      customerName: e.customerName,
      phoneNumber: e.phoneNumber,
      address: e.address,
      message: e.message,
      status: e.status,
      createdAt: new Date(e.createdAt).toLocaleString(),
    }));
    await exportToExcel(
      res,
      'masala-enquiries.xlsx',
      [
        { header: 'Product', key: 'productName' },
        { header: 'Quantity (kg)', key: 'quantityKg', width: 14 },
        { header: 'Customer', key: 'customerName' },
        { header: 'Phone', key: 'phoneNumber' },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Message', key: 'message', width: 25 },
        { header: 'Status', key: 'status' },
        { header: 'Submitted At', key: 'createdAt', width: 22 },
      ],
      rows
    );
  })
);

module.exports = router;
