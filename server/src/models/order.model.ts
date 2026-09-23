import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  items: [{ name: String, quantity: Number, price: Number }],
  totalAmount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], required: true },
  trackingNumber: String,
  cancellationReason: String,
  createdAt: { type: Date, required: true },
  deliveredAt: Date
}, { timestamps: true });

export const Order = model('Order', orderSchema);
