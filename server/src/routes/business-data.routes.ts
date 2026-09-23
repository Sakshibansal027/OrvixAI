import { Router } from 'express';
import { getCustomerById, getOrderById, getPaymentById, getRefundById, getTicketsByCustomerId } from '../controllers/business-data.controller.js';

export const businessDataRouter = Router();
businessDataRouter.get('/customers/:id', getCustomerById);
businessDataRouter.get('/orders/:id', getOrderById);
businessDataRouter.get('/payments/:id', getPaymentById);
businessDataRouter.get('/refunds/:id', getRefundById);
businessDataRouter.get('/customers/:id/tickets', getTicketsByCustomerId);
