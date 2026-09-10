const express = require('express');
const asyncHandler = require('express-async-handler');
const { ContactEnquiry, PortfolioItem, Setting } = require('../models/Misc');
const CateringOrder = require('../models/CateringOrder');
const MasalaEnquiry = require('../models/MasalaEnquiry');
const OilEnquiry = require('../models/OilEnquiry');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { uploadStream, deleteAsset, isCloudinaryConfigured } = require('../utils/cloudinary');

const router = express.Router();

/* ---------------------------- CONTACT (PUBLIC) --------------------------- */
router.post(
  '/contact',
  asyncHandler(async (req, res) => {
    const enquiry = await ContactEnquiry.create(req.body);
    res.status(201).json({ success: true, data: enquiry });
  })
);

/* ------------------------- SETTINGS (PUBLIC READ) ------------------------ */
// Used for things like FSSAI license image URL, WhatsApp number, About text, etc.
router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const settings = await Setting.find();
    const map = {};
    settings.forEach((s) => (map[s.key] = s.value));
    res.json({ success: true, data: map });
  })
);

router.put(
  '/settings/:key',
  protect,
  asyncHandler(async (req, res) => {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: setting });
  })
);

/* --------------------------- PORTFOLIO (PUBLIC) --------------------------- */
router.get(
  '/portfolio/:business',
  asyncHandler(async (req, res) => {
    const items = await PortfolioItem.find({ business: req.params.business }).sort({
      order: 1,
    });
    res.json({ success: true, data: items });
  })
);

router.post(
  '/portfolio',
  protect,
  asyncHandler(async (req, res) => {
    const item = await PortfolioItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  })
);

router.delete(
  '/portfolio/:id',
  protect,
  asyncHandler(async (req, res) => {
    await PortfolioItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Portfolio item deleted' });
  })
);

/* ------------------------------ FILE UPLOAD ------------------------------ */
// Handles FSSAI license, product photos, mill/oil videos, gallery images, etc.
// Uploads to Cloudinary if credentials are configured; otherwise falls back to local disk storage.
router.post(
  '/upload',
  protect,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const folder = req.body.folder || process.env.CLOUDINARY_FOLDER || 'migroups';

    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadStream(req.file.buffer, {
          folder,
          resource_type: 'auto',
        });

        return res.status(201).json({
          success: true,
          provider: 'cloudinary',
          data: {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          },
        });
      } catch (uploadError) {
        res.status(500);
        throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
      }
    }

    // Fallback: local disk storage if Cloudinary credentials are not set
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(req.file.originalname) || '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${unique}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    res.status(201).json({
      success: true,
      provider: 'local',
      data: {
        url: `/uploads/${filename}`,
        filename,
        bytes: req.file.size,
      },
    });
  })
);

// Delete uploaded asset from Cloudinary or local uploads folder
router.delete(
  '/upload',
  protect,
  asyncHandler(async (req, res) => {
    const { public_id, resource_type = 'image', filename } = req.body;

    if (public_id && isCloudinaryConfigured()) {
      const result = await deleteAsset(public_id, resource_type);
      return res.json({
        success: true,
        message: 'Asset deleted from Cloudinary',
        data: result,
      });
    }

    if (filename) {
      const filePath = path.join(__dirname, '..', 'uploads', path.basename(filename));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: 'Local file deleted' });
      }
    }

    res.status(400);
    throw new Error('Please provide public_id for Cloudinary or filename for local storage');
  })
);

/* --------------------------- ADMIN DASHBOARD SUMMARY ---------------------------- */
router.get(
  '/admin/summary',
  protect,
  asyncHandler(async (req, res) => {
    const [pendingCatering, newMasala, newOil, newContacts] = await Promise.all([
      CateringOrder.countDocuments({ status: 'Pending' }),
      MasalaEnquiry.countDocuments({ status: 'New' }),
      OilEnquiry.countDocuments({ status: 'New' }),
      ContactEnquiry.countDocuments({ status: 'New' }),
    ]);
    res.json({
      success: true,
      data: { pendingCatering, newMasala, newOil, newContacts },
    });
  })
);

router.get(
  '/admin/contacts',
  protect,
  asyncHandler(async (req, res) => {
    const contacts = await ContactEnquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  })
);

module.exports = router;
