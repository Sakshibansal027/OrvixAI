import type { Request, Response, NextFunction } from 'express';
import { getCustomer, getOrder, getPayment, getRefund, getCustomerTickets } from '../tools/business-data.tools.js';

async function handleLookup(lookup: () => Promise<unknown>, response: Response, next: NextFunction): Promise<void> {
  try {
    const result = await lookup();
    if (!result || (Array.isArray(result) && result.length === 0)) {
      response.status(404).json({ error: 'Record not found' });
      return;
    }
    response.json(result);
  } catch (error) {
    next(error);
  }
}

function routeId(request: Request, response: Response): string | null {
  const id = request.params.id;
  if (typeof id !== 'string' || id.length === 0) {
    response.status(400).json({ error: 'A valid record id is required' });
    return null;
  }
  return id;
}

export function getCustomerById(request: Request, response: Response, next: NextFunction) {
  const id = routeId(request, response);
  return id ? handleLookup(() => getCustomer(id), response, next) : undefined;
}

export function getOrderById(request: Request, response: Response, next: NextFunction) {
  const id = routeId(request, response);
  return id ? handleLookup(() => getOrder(id), response, next) : undefined;
}

export function getPaymentById(request: Request, response: Response, next: NextFunction) {
  const id = routeId(request, response);
  return id ? handleLookup(() => getPayment(id), response, next) : undefined;
}

export function getRefundById(request: Request, response: Response, next: NextFunction) {
  const id = routeId(request, response);
  return id ? handleLookup(() => getRefund(id), response, next) : undefined;
}

export function getTicketsByCustomerId(request: Request, response: Response, next: NextFunction) {
  const id = routeId(request, response);
  return id ? handleLookup(() => getCustomerTickets(id), response, next) : undefined;
}
