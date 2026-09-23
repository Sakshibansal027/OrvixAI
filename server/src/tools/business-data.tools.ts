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

export async function getRelevantOrder(customerId: string, issue: 'payment' | 'delivery', message = '') {
  const mentionedOrderId = message.match(/\bORD[_-][A-Z0-9]+\b/i)?.[0].replace('-', '_');
  if (mentionedOrderId) {
    const mentionedOrder = await Order.findOne({ customerId, orderId: mentionedOrderId }).lean();
    if (mentionedOrder) return mentionedOrder;
  }

  if (issue === 'payment') {
    return Order.findOne({ customerId, status: 'cancelled' }).sort({ createdAt: -1 }).lean();
  }

  const reportsDeliveredButMissing = /marked delivered|says delivered|delivered but|not received|cannot find|can't find|missing parcel/i.test(message);
  const preferredStatus = reportsDeliveredButMissing ? 'delivered' : { $in: ['processing', 'shipped'] };
  const preferredOrder = await Order.findOne({ customerId, status: preferredStatus }).sort({ createdAt: -1 }).lean();
  return preferredOrder ?? Order.findOne({ customerId }).sort({ createdAt: -1 }).lean();
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
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'support', 'policy']);
  const terms = [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stopWords.has(term)))];
  const policies = await CompanyPolicy.find({ active: true }).lean();
  return policies
    .map((policy) => {
      const title = policy.title.toLowerCase();
      const keywords = policy.keywords.join(' ').toLowerCase();
      const content = policy.content.toLowerCase();
      const score = terms.reduce((total, term) => total + (title.includes(term) ? 5 : 0) + (keywords.includes(term) ? 3 : 0) + (content.includes(term) ? 1 : 0), 0);
      return { policy, score };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map(({ policy }) => policy);
}
