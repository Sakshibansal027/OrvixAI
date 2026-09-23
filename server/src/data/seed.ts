import { connectDatabase, disconnectDatabase } from '../db/mongoose.js';
import { CompanyPolicy } from '../models/company-policy.model.js';
import { Customer } from '../models/customer.model.js';
import { Order } from '../models/order.model.js';
import { Payment } from '../models/payment.model.js';
import { Refund } from '../models/refund.model.js';
import { SupportTicket } from '../models/support-ticket.model.js';

const date = (value: string) => new Date(value);

async function seed(): Promise<void> {
  await connectDatabase();
  await Promise.all([
    Customer.deleteMany({}), Order.deleteMany({}), Payment.deleteMany({}),
    Refund.deleteMany({}), SupportTicket.deleteMany({}), CompanyPolicy.deleteMany({})
  ]);

  await Customer.insertMany([
    { customerId: 'CUS_1001', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91-9876543210', tier: 'premium', accountStatus: 'active', createdAt: date('2024-02-14') },
    { customerId: 'CUS_1002', name: 'Aisha Mehta', email: 'aisha.mehta@example.com', phone: '+91-9811122233', tier: 'standard', accountStatus: 'active', createdAt: date('2024-05-03') },
    { customerId: 'CUS_1003', name: 'Vikram Rao', email: 'vikram.rao@example.com', phone: '+91-9898989898', tier: 'standard', accountStatus: 'locked', createdAt: date('2023-11-20') }
  ]);

  await Order.insertMany([
    { orderId: 'ORD_8391', customerId: 'CUS_1001', items: [{ name: 'Wireless Headphones', quantity: 1, price: 4999 }], totalAmount: 4999, currency: 'INR', status: 'cancelled', cancellationReason: 'Inventory allocation failed after payment authorization', createdAt: date('2026-09-18T10:20:00Z') },
    { orderId: 'ORD_8392', customerId: 'CUS_1002', items: [{ name: 'Smart Watch', quantity: 1, price: 7999 }], totalAmount: 7999, currency: 'INR', status: 'delivered', trackingNumber: 'TRK_7712', createdAt: date('2026-09-15T08:00:00Z'), deliveredAt: date('2026-09-19T13:10:00Z') },
    { orderId: 'ORD_8393', customerId: 'CUS_1002', items: [{ name: 'USB-C Hub', quantity: 1, price: 1999 }], totalAmount: 1999, currency: 'INR', status: 'shipped', trackingNumber: 'TRK_8834', createdAt: date('2026-09-21T09:45:00Z') }
  ]);

  await Payment.insertMany([
    { paymentId: 'TXN_10492', orderId: 'ORD_8391', customerId: 'CUS_1001', amount: 4999, currency: 'INR', status: 'success', method: 'UPI', processedAt: date('2026-09-18T10:20:04Z'), gatewayReference: 'GW_445901' },
    { paymentId: 'TXN_10493', orderId: 'ORD_8392', customerId: 'CUS_1002', amount: 7999, currency: 'INR', status: 'success', method: 'card', processedAt: date('2026-09-15T08:00:04Z'), gatewayReference: 'GW_445902' },
    { paymentId: 'TXN_10494', orderId: 'ORD_8393', customerId: 'CUS_1002', amount: 1999, currency: 'INR', status: 'success', method: 'card', processedAt: date('2026-09-21T09:45:04Z'), gatewayReference: 'GW_445903' }
  ]);

  await Refund.insertMany([
    { refundId: 'REF_5501', orderId: 'ORD_8391', paymentId: 'TXN_10492', amount: 4999, currency: 'INR', status: 'initiated', expectedBy: date('2026-09-25T00:00:00Z'), reason: 'Order cancelled after successful payment' }
  ]);

  await SupportTicket.insertMany([
    { ticketId: 'TCK_2001', customerId: 'CUS_1001', subject: 'Previous refund question', status: 'resolved', messages: [{ role: 'customer', content: 'Can I update my delivery address?', createdAt: date('2026-08-12T09:00:00Z') }, { role: 'agent', content: 'The address was updated before dispatch.', createdAt: date('2026-08-12T09:15:00Z') }], createdAt: date('2026-08-12T09:00:00Z') },
    { ticketId: 'TCK_2002', customerId: 'CUS_1002', subject: 'Delivery confirmation', status: 'open', messages: [{ role: 'customer', content: 'My order is marked delivered but I cannot find it.', createdAt: date('2026-09-20T11:30:00Z') }], createdAt: date('2026-09-20T11:30:00Z') }
  ]);

  await CompanyPolicy.insertMany([
    { policyId: 'POL_REFUND_01', title: 'Cancelled order refund policy', keywords: ['cancelled', 'refund', 'payment'], content: 'When an order is cancelled after a successful payment, ORVIX may confirm that a refund was initiated. The original payment provider can take 5-7 business days to post the funds. Manual escalation is required when the expected date has passed or the refund is disputed.', active: true },
    { policyId: 'POL_DELIVERY_01', title: 'Delivered but not received policy', keywords: ['delivered', 'missing', 'delivery'], content: 'For a delivered-but-not-received complaint, verify delivery metadata and ask the customer to check the delivery location. Escalate to the carrier investigation queue when the parcel cannot be located.', active: true },
    { policyId: 'POL_ACCOUNT_01', title: 'Locked account policy', keywords: ['account', 'locked', 'access'], content: 'Locked accounts require identity verification before an unlock. Do not disclose internal security signals. Escalate when verification cannot be completed.', active: true }
  ]);

  console.log('ORVIX seed complete: customers, orders, payments, refunds, tickets, and policies inserted.');
  await disconnectDatabase();
}

seed().catch(async (error: unknown) => {
  console.error('Seed failed:', error);
  await disconnectDatabase();
  process.exitCode = 1;
});
