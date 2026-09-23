import type { InvestigationResult } from '../types/support.js';

export interface ResponseGenerationInput {
  customerName: string;
  customerMessage: string;
  investigation: InvestigationResult;
  ticketId?: string;
}

export interface AiService {
  generateResponse(input: ResponseGenerationInput): Promise<string>;
}

class VerifiedDataFallbackService implements AiService {
  async generateResponse(input: ResponseGenerationInput): Promise<string> {
    const { customerName, investigation } = input;
    const facts = investigation.findings.join(' ');

    if (/\bwhy\b|\breason\b|how come/i.test(input.customerMessage) && investigation.rootCause && /cancel/i.test(investigation.issue)) {
      const firstName = customerName.split(' ')[0];
      const reason = investigation.rootCause.toLowerCase().includes('inventory allocation failed')
        ? 'our inventory system could not reserve the item after your payment was authorized'
        : investigation.rootCause.replace(/^the order was cancelled because /i, '');
      const resolution = investigation.resolution ? ` ${investigation.resolution}` : '';
      return `${firstName}, your order was cancelled because ${reason}.${resolution}`.replace(/\s+/g, ' ').trim();
    }

    if (investigation.requiresHuman) {
      const nextStep = investigation.resolution ?? 'I cannot safely complete this request automatically.';
      const reason = investigation.escalationReason ? ` ${investigation.escalationReason}` : '';
      const opening = investigation.specialist === 'account'
        ? `I found what’s blocking your account, ${customerName.split(' ')[0]}.`
        : investigation.specialist === 'order_delivery'
          ? `I checked that order for you, ${customerName.split(' ')[0]}.`
          : `I checked this for you, ${customerName.split(' ')[0]}.`;
      const handoff = input.ticketId
        ? `I’ve opened support case ${input.ticketId} with the findings and conversation context for a support agent to review.`
        : 'A support agent needs to review this before I can safely resolve it.';
      return `${opening} ${facts} ${nextStep}${reason} ${handoff}`.replace(/\s+/g, ' ').trim();
    }

    const opening = investigation.specialist === 'billing'
      ? `I checked the payment and order records for you, ${customerName.split(' ')[0]}.`
      : `I checked this for you, ${customerName.split(' ')[0]}.`;
    return `${opening} ${facts} ${investigation.rootCause ?? ''} ${investigation.resolution ?? ''}`.replace(/\s+/g, ' ').trim();
  }
}

export const aiService: AiService = new VerifiedDataFallbackService();
