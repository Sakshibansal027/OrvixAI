import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SupportConversation } from '../models/support-conversation.model.js';
import { SupportTicket } from '../models/support-ticket.model.js';
import { Customer } from '../models/customer.model.js';

export async function listSupportTickets(_request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const tickets = await SupportTicket.find({ status: 'open' }).sort({ createdAt: -1 }).lean();
    const customers = await Customer.find({ customerId: { $in: tickets.map((ticket) => ticket.customerId) } }).lean();
    const names = new Map(customers.map((customer) => [customer.customerId, customer.name]));
    response.json(tickets.map((ticket) => ({ ...ticket, customerName: names.get(ticket.customerId) ?? ticket.customerId })));
  } catch (error) {
    next(error);
  }
}

const replySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  agentName: z.string().trim().min(1).max(100).default('Support Agent')
});

export async function replyToSupportTicket(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = z.string().trim().min(1).max(100).parse(request.params.ticketId);
    const { message, agentName } = replySchema.parse(request.body);
    const ticket = await SupportTicket.findOne({ ticketId, status: 'open' });
    if (!ticket) {
      response.status(404).json({ error: 'Open support ticket not found' });
      return;
    }

    const createdAt = new Date();
    ticket.messages.push({ role: 'agent', content: message, createdAt });
    ticket.status = 'resolved';
    await ticket.save();

    const conversation = await SupportConversation.findOne({ ticketId });
    if (conversation) {
      conversation.messages.push({ role: 'assistant', content: `${agentName}: ${message}`, createdAt });
      conversation.status = 'resolved';
      await conversation.save();
    }

    response.json({ ticketId, status: ticket.status, message, agentName, createdAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'Invalid support reply', details: error.issues });
      return;
    }
    next(error);
  }
}
