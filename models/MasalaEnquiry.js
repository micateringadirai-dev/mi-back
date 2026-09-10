const mongoose = require('mongoose');

const masalaEnquirySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'MasalaProduct' },
    productName: { type: String, required: true },
    quantityKg: { type: Number, required: true, min: 0.5 },
    customerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Confirmed', 'Closed'],
      default: 'New',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MasalaEnquiry', masalaEnquirySchema);
