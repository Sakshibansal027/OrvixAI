import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SupportConversation } from '../models/support-conversation.model.js';
import { processChatMessage } from '../services/chat.service.js';

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  customerId: z.string().trim().min(1).max(100)
});

export async function postChat(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const input = chatRequestSchema.parse(request.body);
    response.json(await processChatMessage(input));
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'Invalid chat request', details: error.issues });
      return;
    }
    next(error);
  }
}

export async function getConversationHistory(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const customerId = z.string().trim().min(1).max(100).parse(request.params.customerId);
    const conversation = await SupportConversation.findOne({ customerId }).sort({ updatedAt: -1 }).lean();
    response.json({
      conversationId: conversation?._id.toString() ?? null,
      messages: (conversation?.messages ?? []).map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt
      }))
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: 'A valid customer id is required' });
      return;
    }
    next(error);
  }
}
