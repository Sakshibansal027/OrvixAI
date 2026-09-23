import type { ChatContext, Specialist } from '../types/support.js';

export interface RoutingDecision {
  specialist: Specialist;
  relatedSpecialists: Specialist[];
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

export function routeToSpecialist(context: ChatContext): RoutingDecision {
  const currentText = context.message.toLowerCase();
  const historyText = context.recentMessages?.map((message) => message.content).join(' ').toLowerCase() ?? '';

  const currentHasCategory = hasAny(currentText, [
    'payment', 'paid', 'deducted', 'charged', 'transaction', 'refund',
    'order', 'delivery', 'delivered', 'shipment', 'shipping', 'received', 'cancelled', 'canceled',
    'account', 'login', 'log in', 'logged in', 'access', 'password', 'sign in',
    'app', 'application', 'crash', 'bug', 'error', 'website', 'not working'
  ]);
  const currentWordCount = currentText.split(/\s+/).filter(Boolean).length;
  const contextualQuestion = hasAny(currentText, ['why was', 'why did', 'what caused', 'when will', 'how long', 'can you explain']);
  const likelyFollowUp = Boolean(historyText) && (contextualQuestion || (!currentHasCategory && currentWordCount <= 8 && hasAny(currentText, ['it', 'that', 'this', 'when', 'what', 'why', 'how', 'still', 'again'])));
  const text = likelyFollowUp ? `${historyText} ${currentText}` : currentText;

  const paymentIssue = hasAny(text, ['payment', 'paid', 'deducted', 'charged', 'transaction', 'refund']);
  const deliveryIssue = hasAny(text, ['order', 'delivery', 'delivered', 'shipment', 'shipping', 'received', 'cancelled', 'canceled']);
  const accountIssue = hasAny(text, ['account', 'login', 'log in', 'logged in', 'access', 'password', 'sign in']);
  const technicalIssue = hasAny(text, ['app', 'application', 'crash', 'bug', 'error', 'website', 'not working']);

  if (paymentIssue) {
    return {
      specialist: 'billing',
      relatedSpecialists: deliveryIssue ? ['order_delivery'] : [],
      confidence: 'high',
      reason: 'The message contains payment or refund language.'
    };
  }

  if (deliveryIssue) {
    return {
      specialist: 'order_delivery',
      relatedSpecialists: [],
      confidence: 'high',
      reason: 'The message contains order or delivery language.'
    };
  }

  if (accountIssue) {
    return {
      specialist: 'account',
      relatedSpecialists: [],
      confidence: 'high',
      reason: 'The message contains account access language.'
    };
  }

  if (technicalIssue) {
    return {
      specialist: 'technical',
      relatedSpecialists: [],
      confidence: 'medium',
      reason: 'The message contains product or application malfunction language.'
    };
  }

  return {
    specialist: 'technical',
    relatedSpecialists: [],
    confidence: 'low',
    reason: 'No supported issue category was confidently identified.'
  };
}
