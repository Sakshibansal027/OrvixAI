import { Schema, model } from 'mongoose';

const refundSchema = new Schema({
  refundId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['not_applicable', 'initiated', 'processing', 'completed'], required: true },
  expectedBy: Date,
  reason: String
}, { timestamps: true });

export const Refund = model('Refund', refundSchema);
