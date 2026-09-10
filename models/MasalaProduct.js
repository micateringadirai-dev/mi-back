const mongoose = require('mongoose');

const masalaProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Chilli Powder"
    description: { type: String, default: '' },
    images: [{ type: String }],
    availableQuantityKg: { type: Number, default: 0 }, // stock indicator
    pricePerKg: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MasalaProduct', masalaProductSchema);
