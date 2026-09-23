export type Specialist = 'billing' | 'order_delivery' | 'account' | 'technical';
export type ConversationStatus = 'open' | 'resolved' | 'needs_human';

export interface InvestigationResult {
  issue: string;
  specialist: Specialist;
  findings: string[];
  rootCause: string | null;
  resolution: string | null;
  requiresHuman: boolean;
  escalationReason?: string;
  dataChecked: string[];
}

export interface ChatContext {
  customerId: string;
  message: string;
  recentMessages?: Array<{ role: 'customer' | 'assistant'; content: string }>;
}
