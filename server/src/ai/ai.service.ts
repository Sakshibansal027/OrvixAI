import type { InvestigationResult } from '../types/support.js';

export interface ResponseGenerationInput {
  customerName: string;
  investigation: InvestigationResult;
}

export interface AiService {
  generateResponse(input: ResponseGenerationInput): Promise<string>;
}

class VerifiedDataFallbackService implements AiService {
  async generateResponse(input: ResponseGenerationInput): Promise<string> {
    const { customerName, investigation } = input;
    const facts = investigation.findings.join(' ');

    if (investigation.requiresHuman) {
      const nextStep = investigation.resolution ?? 'I cannot safely complete this request automatically.';
      const reason = investigation.escalationReason ? ` ${investigation.escalationReason}` : '';
      const opening = investigation.specialist === 'account'
        ? `I found what’s blocking your account, ${customerName.split(' ')[0]}.`
        : investigation.specialist === 'order_delivery'
          ? `I checked that order for you, ${customerName.split(' ')[0]}.`
          : `I checked this for you, ${customerName.split(' ')[0]}.`;
      return `${opening} ${facts} ${nextStep}${reason} I’ve passed everything to support, so you won’t have to explain it all again.`.replace(/\s+/g, ' ').trim();
    }

    const opening = investigation.specialist === 'billing'
      ? `I checked the payment and order records for you, ${customerName.split(' ')[0]}.`
      : `I checked this for you, ${customerName.split(' ')[0]}.`;
    return `${opening} ${facts} ${investigation.rootCause ?? ''} ${investigation.resolution ?? ''}`.replace(/\s+/g, ' ').trim();
  }
}

export const aiService: AiService = new VerifiedDataFallbackService();
