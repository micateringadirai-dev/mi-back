const mongoose = require('mongoose');

const grindingServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Dry Red Chilli (மிளகாய்)"
    category: { type: String, default: 'Spices' }, // e.g. "Spices", "Blends", "Grains & Flours"
    grindingType: { type: String, default: 'Fine Powder Grinding' }, // e.g. "Fine Powder", "Coarse Crushing", "Stone Ground"
    pricePerKg: { type: Number, required: true, min: 0 }, // e.g. 25
    minQuantityKg: { type: Number, default: 1, min: 0.1 },
    notes: { type: String, default: '' }, // e.g. "Must be sun-dried and cleaned"
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrindingService', grindingServiceSchema);
