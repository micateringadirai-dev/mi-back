const mongoose = require('mongoose');

const oilEnquirySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'OilProduct' },
    productName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    customerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    additionalRequirements: { type: String, default: '' },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Confirmed', 'Closed'],
      default: 'New',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OilEnquiry', oilEnquirySchema);
