import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
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
