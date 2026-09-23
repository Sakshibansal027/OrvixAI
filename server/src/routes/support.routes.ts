import { Router } from 'express';
import { listSupportTickets, replyToSupportTicket } from '../controllers/support.controller.js';

export const supportRouter = Router();
supportRouter.get('/tickets', listSupportTickets);
supportRouter.post('/tickets/:ticketId/replies', replyToSupportTicket);
