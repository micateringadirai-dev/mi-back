const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const MasalaProduct = require('../models/MasalaProduct');
const MasalaEnquiry = require('../models/MasalaEnquiry');
const GrindingService = require('../models/GrindingService');
const sendEmail = require('../utils/sendEmail');
const exportToExcel = require('../utils/exportExcel');
const { protect } = require('../middleware/auth');

const defaultGrindingServices = [
  {
    name: 'Dry Red Chilli (சிகப்பு மிளகாய்)',
    category: 'Spices',
    grindingType: 'Fine Powder Grinding',
    pricePerKg: 25,
    minQuantityKg: 1,
    notes: 'Sun-dried chillies without moisture. Stalks removed for best rich color & pungency.',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600',
    isActive: true,
    orderIndex: 1,
  },
  {
    name: 'Coriander Seeds / Dhania (மல்லி)',
    category: 'Spices',
    grindingType: 'Fine Powder Grinding',
    pricePerKg: 25,
    minQuantityKg: 1,
    notes: 'Cleaned and crisp sun-dried whole coriander seeds.',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&sat=-15',
    isActive: true,
    orderIndex: 2,
  },
  {
    name: 'Salem Turmeric Roots / Manjal (மஞ்சள்)',
    category: 'Spices',
    grindingType: 'Pounding & Fine Milling',
    pricePerKg: 35,
    minQuantityKg: 1,
    notes: 'Crisp dry turmeric fingers. Machine pounded and stone ground for deep golden medicinal aroma.',
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?q=80&w=600',
    isActive: true,
    orderIndex: 3,
  },
  {
    name: 'Sambar & Kulambu Masala Blend (சாம்பார் மசாலா)',
    category: 'Blends',
    grindingType: 'Traditional Stone Grinding',
    pricePerKg: 30,
    minQuantityKg: 1,
    notes: 'Bring your roasted family spice blend ingredients. Milled to perfect aromatic consistency.',
    image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=600',
    isActive: true,
    orderIndex: 4,
  },
  {
    name: 'Cumin & Black Pepper (சீரகம் & மிளகு)',
    category: 'Spices',
    grindingType: 'Fine or Coarse Texture',
    pricePerKg: 35,
    minQuantityKg: 0.5,
    notes: 'Low heat milling to preserve volatile natural essential oils.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=600',
    isActive: true,
    orderIndex: 5,
  },
  {
    name: 'Idli / Dosa Podi (இட்லி மிளகாய் பொடி)',
    category: 'Blends',
    grindingType: 'Authentic Coarse Crushing',
    pricePerKg: 25,
    minQuantityKg: 1,
    notes: 'Roasted dal, curry leaves, and red chillies crushed to authentic crunchy coarse texture.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600',
    isActive: true,
    orderIndex: 6,
  },
  {
    name: 'Whole Wheat / Ragi / Rice (கோதுமை & மாவு அரைவை)',
    category: 'Grains & Flours',
    grindingType: 'Smooth Flour Milling',
    pricePerKg: 15,
    minQuantityKg: 2,
    notes: 'Clean whole grains milled fresh without overheating or nutrients loss.',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600',
    isActive: true,
    orderIndex: 7,
  },
];

const router = express.Router();

/* PUBLIC */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const products = await MasalaProduct.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: products });
  })
);

router.get(
  '/grinding-services',
  asyncHandler(async (req, res) => {
    let services = await GrindingService.find({ isActive: true }).sort({ orderIndex: 1, name: 1 });
    if (!services || services.length === 0) {
      const count = await GrindingService.countDocuments();
      if (count === 0) {
        await GrindingService.insertMany(defaultGrindingServices);
        services = await GrindingService.find({ isActive: true }).sort({ orderIndex: 1, name: 1 });
      }
    }
    res.json({ success: true, data: services });
  })
);

router.post(
  '/enquiries',
  [
    body('productName').notEmpty(),
    body('quantityKg').isFloat({ min: 0.01 }),
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

/* ADMIN - GRINDING SERVICES */
router.get(
  '/admin/grinding-services',
  asyncHandler(async (req, res) => {
    const count = await GrindingService.countDocuments();
    if (count === 0) {
      await GrindingService.insertMany(defaultGrindingServices);
    }
    const services = await GrindingService.find().sort({ orderIndex: 1, name: 1 });
    res.json({ success: true, data: services });
  })
);

router.post(
  '/admin/grinding-services',
  asyncHandler(async (req, res) => {
    const service = await GrindingService.create(req.body);
    res.status(201).json({ success: true, data: service });
  })
);

router.put(
  '/admin/grinding-services/:id',
  asyncHandler(async (req, res) => {
    const service = await GrindingService.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      res.status(404);
      throw new Error('Grinding service item not found');
    }
    res.json({ success: true, data: service });
  })
);

router.delete(
  '/admin/grinding-services/:id',
  asyncHandler(async (req, res) => {
    const service = await GrindingService.findByIdAndDelete(req.params.id);
    if (!service) {
      res.status(404);
      throw new Error('Grinding service item not found');
    }
    res.json({ success: true, message: 'Grinding service deleted' });
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
