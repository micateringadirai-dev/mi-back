const mongoose = require('mongoose');

const packageSizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true }, // e.g. "500ml", "1L", "5L"
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const oilProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['Sesame Oil (Nallennai)', 'Coconut Oil', 'Groundnut Oil'],
    },
    description: { type: String, default: '' },
    images: [{ type: String }],
    packageSizes: [packageSizeSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OilProduct', oilProductSchema);
