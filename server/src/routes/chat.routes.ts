import { Router } from 'express';
import { getConversationHistory, postChat } from '../controllers/chat.controller.js';

export const chatRouter = Router();
chatRouter.get('/:customerId', getConversationHistory);
chatRouter.post('/', postChat);
