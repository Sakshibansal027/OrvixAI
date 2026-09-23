import { Schema, model } from 'mongoose';
import type { ConversationStatus, InvestigationResult, Specialist } from '../types/support.js';

const messageSchema = new Schema({
  role: { type: String, enum: ['customer', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, required: true }
}, { _id: false });

const investigationSchema = new Schema({
  issue: { type: String, required: true },
  specialist: { type: String, enum: ['billing', 'order_delivery', 'account', 'technical'], required: true },
  findings: [{ type: String }],
  rootCause: String,
  resolution: String,
  requiresHuman: { type: Boolean, required: true },
  escalationReason: String,
  dataChecked: [{ type: String }]
}, { _id: false });

const supportConversationSchema = new Schema({
  customerId: { type: String, required: true, index: true },
  messages: { type: [messageSchema], default: [] },
  specialist: { type: String, enum: ['billing', 'order_delivery', 'account', 'technical'] },
  currentIssue: String,
  investigation: investigationSchema,
  status: { type: String, enum: ['open', 'resolved', 'needs_human'], required: true, default: 'open' }
}, { timestamps: true });

export const SupportConversation = model('SupportConversation', supportConversationSchema);
export type StoredInvestigation = InvestigationResult;
export type StoredSpecialist = Specialist;
export type StoredConversationStatus = ConversationStatus;
