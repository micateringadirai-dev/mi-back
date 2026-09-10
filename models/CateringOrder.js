const mongoose = require('mongoose');

const cateringOrderSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'CateringEvent' },
    itemName: { type: String, required: true }, // freeform in case not tied to a listed event
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    numberOfPackets: { type: Number, required: true, min: 1 },
    orderDate: { type: Date, required: true }, // date the food is needed
    address: { type: String, required: true },
    foodRequirements: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    estimatedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cateringOrderSchema.index({ orderDate: 1, status: 1 });

module.exports = mongoose.model('CateringOrder', cateringOrderSchema);
