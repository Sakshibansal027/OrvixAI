import { CompanyPolicy } from '../models/company-policy.model.js';
import { Customer } from '../models/customer.model.js';
import { Order } from '../models/order.model.js';
import { Payment } from '../models/payment.model.js';
import { Refund } from '../models/refund.model.js';
import { SupportTicket } from '../models/support-ticket.model.js';

export async function getCustomer(customerId: string) {
  return Customer.findOne({ customerId }).lean();
}

export async function getOrder(orderId: string) {
  return Order.findOne({ orderId }).lean();
}

export async function getCustomerOrders(customerId: string) {
  return Order.find({ customerId }).sort({ createdAt: -1 }).lean();
}

export async function getRelevantOrder(customerId: string, issue: 'payment' | 'delivery') {
  const status = issue === 'payment' ? 'cancelled' : 'delivered';
  return Order.findOne({ customerId, status }).sort({ createdAt: -1 }).lean();
}

export async function getPayment(paymentId?: string, orderId?: string) {
  if (paymentId) return Payment.findOne({ paymentId }).lean();
  if (orderId) return Payment.findOne({ orderId }).sort({ processedAt: -1 }).lean();
  return null;
}

export async function getRefund(orderId?: string, paymentId?: string) {
  if (orderId) return Refund.findOne({ orderId }).sort({ createdAt: -1 }).lean();
  if (paymentId) return Refund.findOne({ paymentId }).sort({ createdAt: -1 }).lean();
  return null;
}

export async function getCustomerTickets(customerId: string) {
  return SupportTicket.find({ customerId }).sort({ createdAt: -1 }).lean();
}

export async function searchCompanyPolicy(query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const policies = await CompanyPolicy.find({ active: true }).lean();
  return policies.filter((policy) => {
    const haystack = `${policy.title} ${policy.keywords.join(' ')} ${policy.content}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}
