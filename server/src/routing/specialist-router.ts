import type { ChatContext, Specialist } from '../types/support.js';

export interface RoutingDecision {
  specialist: Specialist;
  relatedSpecialists: Specialist[];
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

const issueTerms = {
  billing: ['payment', 'paid', 'deducted', 'charged', 'transaction', 'refund', 'paisa kata', 'paise kate', 'amount debited', 'money deducted'],
  delivery: ['order', 'delivery', 'delivered', 'shipment', 'shipping', 'received', 'cancelled', 'canceled', 'not arrived', 'parcel', 'tracking', 'nahi aaya', 'nhi aaya', 'nahi mila', 'nhi mila', 'deliver nahi', 'deliver nhi'],
  account: ['account', 'login', 'log in', 'logged in', 'access', 'password', 'sign in', 'signin', 'otp', 'locked', 'login nahi'],
  technical: ['app', 'application', 'crash', 'bug', 'error', 'website', 'not working', 'open nahi ho', 'app nahi chal']
};

export function routeToSpecialist(context: ChatContext): RoutingDecision {
  const currentText = context.message.toLowerCase();
  const historyText = context.recentMessages?.filter((message) => message.role === 'customer').slice(-4).map((message) => message.content).join(' ').toLowerCase() ?? '';

  const allIssueTerms = [...issueTerms.billing, ...issueTerms.delivery, ...issueTerms.account, ...issueTerms.technical];
  const currentHasCategory = hasAny(currentText, allIssueTerms);
  const currentWordCount = currentText.split(/\s+/).filter(Boolean).length;
  const contextualQuestion = hasAny(currentText, ['why', 'what caused', 'when will', 'how long', 'can you explain', 'kyu', 'kyon', 'kaise', 'kab']);
  const likelyFollowUp = Boolean(historyText) && (contextualQuestion || (!currentHasCategory && currentWordCount <= 8 && hasAny(currentText, ['it', 'that', 'this', 'when', 'what', 'why', 'how', 'still', 'again'])));
  const text = likelyFollowUp ? `${historyText} ${currentText}` : currentText;

  const paymentIssue = hasAny(text, issueTerms.billing);
  const deliveryIssue = hasAny(text, issueTerms.delivery);
  const accountIssue = hasAny(text, issueTerms.account);
  const technicalIssue = hasAny(text, issueTerms.technical);

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
