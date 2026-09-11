const mongoose = require('mongoose');

const cateringOrderSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'CateringEvent' },
    orderType: {
      type: String,
      enum: ['pre-order', 'quotation'],
      default: 'pre-order',
    },
    itemName: { type: String, required: true }, // freeform in case not tied to a listed event
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    numberOfPackets: { type: Number, required: true, min: 1 },
    portionUnit: { type: String, default: 'Packet' }, // e.g. "Packet" or "1 Kg Bucket"
    unitPrice: { type: Number, default: 0 },
    subtotalAmount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'flat'],
      default: 'none',
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    orderDate: { type: Date, required: true }, // date the food is needed
    deliveryType: {
      type: String,
      enum: ['Delivery', 'Self Service'],
      default: 'Delivery',
    },
    address: { type: String, default: 'Self Service / Kitchen Pickup (Adirampattinam)' },
    foodRequirements: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },
    selectedExtras: [
      {
        name: { type: String },
        portion: { type: String, default: '' },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    estimatedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cateringOrderSchema.index({ orderDate: 1, status: 1, deliveryType: 1 });

module.exports = mongoose.model('CateringOrder', cateringOrderSchema);
