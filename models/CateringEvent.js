const mongoose = require('mongoose');

const cateringEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g. "Fish Biryani"
    eventDate: { type: Date, required: true }, // e.g. September 6
    description: { type: String, default: '' },
    menuItems: [{ type: String }], // e.g. ["Mutton Dum Biryani", "Egg", "Brinjal Dalcha", "Raitha", "Halwa"]
    extraSideDishes: [
      {
        name: { type: String, required: true },
        portion: { type: String, default: '' }, // e.g. "250g" or "4 pcs"
        price: { type: Number, default: 0 },
      },
    ],
    portionUnit: { type: String, default: 'Packet' }, // e.g. "Packet", "1 Kg Bucket (4-5 Persons)"
    pricePerPacket: { type: Number, default: 0 },
    minPackets: { type: Number, default: 1 },
    maxPackets: { type: Number, default: 0 }, // 0 = unlimited
    images: [{ type: String }],
    category: {
      type: String,
      default: 'special-event',
    },
    deliveryOption: {
      type: String,
      enum: ['Both', 'Delivery', 'Self Service'],
      default: 'Both',
    },
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'flat'],
      default: 'none',
    },
    discountValue: { type: Number, default: 0 }, // e.g. 10 for 10% or 200 for ₹200
    minOrderForDiscount: { type: Number, default: 0 },
    isPreOrderActive: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

cateringEventSchema.index({ eventDate: 1 });

module.exports = mongoose.model('CateringEvent', cateringEventSchema);
