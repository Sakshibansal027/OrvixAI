import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  customerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  tier: { type: String, enum: ['standard', 'premium'], required: true },
  accountStatus: { type: String, enum: ['active', 'locked', 'pending_verification'], required: true },
  createdAt: { type: Date, required: true }
}, { timestamps: true });

export const Customer = model('Customer', customerSchema);
