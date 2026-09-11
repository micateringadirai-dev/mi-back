const mongoose = require('mongoose');

const cateringGallerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Mutton Biryani", "Wedding Meals"
    imageUrl: { type: String, required: true },           // Cloudinary or local URL
    description: { type: String, default: '' },           // Optional short description
    order: { type: Number, default: 0 },                  // Display order (lower = first)
    isActive: { type: Boolean, default: true },           // Show/hide on public page
  },
  { timestamps: true }
);

cateringGallerySchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('CateringGallery', cateringGallerySchema);
