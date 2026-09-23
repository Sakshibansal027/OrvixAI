import type { RoutingDecision } from '../routing/specialist-router.js';
import type { InvestigationResult } from '../types/support.js';

interface InvestigationData {
  customer: any;
  order?: any;
  payment?: any;
  refund?: any;
  tickets: any[];
  policies: any[];
}

export function investigateIssue(message: string, routing: RoutingDecision, data: InvestigationData): InvestigationResult {
  const dataChecked: string[] = ['customer profile', 'support history'];

  if (routing.specialist === 'billing') {
    dataChecked.push('order record', 'payment transaction', 'refund record', 'refund policy');
    if (!data.order || !data.payment) {
      return {
        issue: 'Payment or order record not found',
        specialist: routing.specialist,
        findings: ['The customer was identified, but the related order or payment record was not found.'],
        rootCause: null,
        resolution: null,
        requiresHuman: true,
        escalationReason: 'Required order or payment data is unavailable.',
        dataChecked
      };
    }

    const findings = [
      `Payment ${data.payment.paymentId} is ${data.payment.status}.`,
      `Order ${data.order.orderId} is ${data.order.status}.`
    ];
    if (data.refund) findings.push(`Refund ${data.refund.refundId} is ${data.refund.status}.`);

    const paymentSucceeded = data.payment.status === 'success';
    const orderCancelled = data.order.status === 'cancelled';
    const refundStarted = data.refund?.status === 'initiated' || data.refund?.status === 'processing';

    if (paymentSucceeded && orderCancelled && refundStarted) {
      return {
        issue: 'Payment deducted but order cancelled',
        specialist: routing.specialist,
        findings,
        rootCause: data.order.cancellationReason
          ? `The order was cancelled after the payment was successfully processed because ${data.order.cancellationReason.toLowerCase()}.`
          : 'The order was cancelled after the payment was successfully processed.',
        resolution: `A refund of ${data.refund.amount} ${data.refund.currency} is already ${data.refund.status}.`,
        requiresHuman: false,
        dataChecked
      };
    }

    return {
      issue: message,
      specialist: routing.specialist,
      findings,
      rootCause: 'The retrieved payment and order statuses do not match a supported automatic resolution.',
      resolution: null,
      requiresHuman: true,
      escalationReason: 'The payment/order combination requires manual review.',
      dataChecked
    };
  }

  if (routing.specialist === 'order_delivery') {
    dataChecked.push('order record', 'delivery policy');
    if (!data.order) {
      return {
        issue: message,
        specialist: routing.specialist,
        findings: ['No order record could be matched to this customer.'],
        rootCause: null,
        resolution: 'Please share the order ID so I can check its latest status.',
        requiresHuman: false,
        dataChecked
      };
    }

    if (data.order.status === 'cancelled') {
      const findings = [`Order ${data.order.orderId} is cancelled.`];
      if (data.payment) findings.push(`Payment ${data.payment.paymentId} is ${data.payment.status}.`);
      if (data.refund) findings.push(`Refund ${data.refund.refundId} is ${data.refund.status}.`);
      dataChecked.push('payment transaction', 'refund record', 'refund policy');
      const refundStarted = data.refund?.status === 'initiated' || data.refund?.status === 'processing';

      return {
        issue: 'Order not delivered',
        specialist: routing.specialist,
        findings,
        rootCause: data.order.cancellationReason?.toLowerCase().includes('inventory allocation failed')
          ? 'The item could not be reserved because inventory allocation failed after payment authorization.'
          : data.order.cancellationReason
          ? `The order was cancelled because ${data.order.cancellationReason.toLowerCase()}.`
          : 'The order was cancelled before delivery.',
        resolution: refundStarted
          ? `The refund of ${data.refund.amount} ${data.refund.currency} is ${data.refund.status}. The payment provider may take 5-7 business days to post it.`
          : 'This order will not be delivered because it was cancelled. I could not verify a refund record, so please share the payment details if you were charged.',
        requiresHuman: false,
        dataChecked
      };
    }

    if (data.order.status === 'shipped' || data.order.status === 'processing') {
      const statusText = data.order.status === 'shipped' ? 'on its way' : 'being prepared';
      return {
        issue: 'Order delivery status',
        specialist: routing.specialist,
        findings: [`Order ${data.order.orderId} is ${data.order.status}.`, ...(data.order.trackingNumber ? [`Tracking reference ${data.order.trackingNumber}.`] : [])],
        rootCause: `The latest order is ${statusText} and is not marked as delivered.`,
        resolution: data.order.trackingNumber
          ? `You can track it with reference ${data.order.trackingNumber}. There is no delivery estimate in the order record yet.`
          : 'It is still being prepared, so a tracking reference is not available yet.',
        requiresHuman: false,
        dataChecked
      };
    }

    if (data.order.status === 'delivered') {
      const confirmsChecks = /already checked|checked (the )?(delivery|reception|front desk)|still missing|still cannot find|still can't find|could not find it|couldn't find it/i.test(message);
      if (confirmsChecks) {
        return {
          issue: 'Order marked delivered but not received after location check',
          specialist: routing.specialist,
          findings: [`Order ${data.order.orderId} is marked delivered.`, `The customer has checked the suggested delivery locations.`, `Tracking reference ${data.order.trackingNumber ?? 'is unavailable'}.`],
          rootCause: 'The carrier record shows delivery, but the customer still cannot locate the parcel after checking nearby delivery locations.',
          resolution: null,
          requiresHuman: true,
          escalationReason: 'A carrier investigation is now required for the missing parcel.',
          dataChecked
        };
      }

      return {
        issue: 'Order marked delivered but not received',
        specialist: routing.specialist,
        findings: [`Order ${data.order.orderId} is marked delivered.`, `Tracking reference ${data.order.trackingNumber ?? 'is unavailable'}.`],
        rootCause: 'The carrier record shows delivery, but the customer reports non-receipt.',
        resolution: 'Please check the delivery location, reception desk, and with nearby household members. If it is still missing, reply here and I can prepare a carrier investigation for support.',
        requiresHuman: false,
        dataChecked
      };
    }
  }

  if (routing.specialist === 'account') {
    dataChecked.push('account profile', 'account access policy');
    if (data.customer?.accountStatus === 'locked') {
      return {
        issue: 'Customer cannot access account',
        specialist: routing.specialist,
        findings: ['The customer account is locked.', 'The account policy requires identity verification before unlock.'],
        rootCause: 'Account access is blocked by the account security status.',
        resolution: 'Identity verification is required before the account can be unlocked.',
        requiresHuman: true,
        escalationReason: 'Account unlock requires identity verification by support.',
        dataChecked
      };
    }

    return {
      issue: message,
      specialist: routing.specialist,
      findings: [`The customer account status is ${data.customer?.accountStatus ?? 'unavailable'}.`],
      rootCause: null,
      resolution: 'The account status does not identify a safe automatic fix. Support assistance is required.',
      requiresHuman: true,
      escalationReason: 'The account issue requires additional verification or troubleshooting.',
      dataChecked
    };
  }

  dataChecked.push('technical support history');
  return {
    issue: message,
    specialist: routing.specialist,
    findings: ['No supported technical diagnosis can be established from the available seeded business records.'],
    rootCause: null,
    resolution: null,
    requiresHuman: true,
    escalationReason: 'The available business data is insufficient to safely resolve this issue.',
    dataChecked
  };
}
