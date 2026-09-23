import { Schema, model } from 'mongoose';

const supportTicketSchema = new Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'closed'], required: true },
  messages: [{ role: String, content: String, createdAt: Date }],
  investigation: { type: Schema.Types.Mixed },
  createdAt: { type: Date, required: true }
}, { timestamps: true });

export const SupportTicket = model('SupportTicket', supportTicketSchema);
