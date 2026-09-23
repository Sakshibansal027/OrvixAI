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
        issue: message,
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
        findings: ['No delivered order record was found for this customer.'],
        rootCause: null,
        resolution: null,
        requiresHuman: true,
        escalationReason: 'A delivered order record was not available for investigation, so support must verify the order manually.',
        dataChecked
      };
    }

    if (data.order.status === 'delivered') {
      return {
        issue: 'Order marked delivered but not received',
        specialist: routing.specialist,
        findings: [`Order ${data.order.orderId} is marked delivered.`, `Tracking reference ${data.order.trackingNumber ?? 'is unavailable'}.`],
        rootCause: 'The carrier record shows delivery, but the customer reports non-receipt.',
        resolution: 'Please check the delivery location and nearby household or building reception areas. A carrier investigation is required if the parcel remains missing.',
        requiresHuman: true,
        escalationReason: 'Carrier investigation is required for a delivered-but-not-received order.',
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
