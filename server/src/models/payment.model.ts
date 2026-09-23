import { Schema, model } from 'mongoose';

const paymentSchema = new Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], required: true },
  method: { type: String, required: true },
  processedAt: { type: Date, required: true },
  gatewayReference: { type: String, required: true }
}, { timestamps: true });

export const Payment = model('Payment', paymentSchema);
