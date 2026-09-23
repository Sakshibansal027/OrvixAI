import { Schema, model } from 'mongoose';

const companyPolicySchema = new Schema({
  policyId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  keywords: [{ type: String }],
  content: { type: String, required: true },
  active: { type: Boolean, required: true, default: true }
}, { timestamps: true });

export const CompanyPolicy = model('CompanyPolicy', companyPolicySchema);
