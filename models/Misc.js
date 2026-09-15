const mongoose = require('mongoose');

// General contact-us enquiries (not tied to a specific product)
const contactEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    business: {
      type: String,
      enum: ['MI Catering', 'Ibrahim Masala Mill', 'Afiyah Cold Pressed Oils', 'General'],
      default: 'General',
    },
    message: { type: String, required: true },
    status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New' },
  },
  { timestamps: true }
);

// Reusable portfolio/gallery items for all three businesses
const portfolioItemSchema = new mongoose.Schema(
  {
    business: {
      type: String,
      enum: ['MI Catering', 'Ibrahim Masala Mill', 'Afiyah Cold Pressed Oils', 'Afia Cold Press Oil'],
      required: true,
    },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Site-wide editable settings (FSSAI license image, phone numbers, about text, etc.)
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. 'fssaiLicense', 'whatsappNumber', 'cateringAbout'
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = {
  ContactEnquiry: mongoose.model('ContactEnquiry', contactEnquirySchema),
  PortfolioItem: mongoose.model('PortfolioItem', portfolioItemSchema),
  Setting: mongoose.model('Setting', settingsSchema),
};
