const mongoose = require('mongoose');

const cateringEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g. "Fish Biryani"
    eventDate: { type: Date, required: true }, // e.g. September 6
    description: { type: String, default: '' },
    pricePerPacket: { type: Number, default: 0 },
    minPackets: { type: Number, default: 10 },
    images: [{ type: String }],
    category: {
      type: String,
      enum: ['wedding', 'housewarming', 'corporate', 'daily-menu', 'special-event', 'other'],
      default: 'special-event',
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

cateringEventSchema.index({ eventDate: 1 });

module.exports = mongoose.model('CateringEvent', cateringEventSchema);
