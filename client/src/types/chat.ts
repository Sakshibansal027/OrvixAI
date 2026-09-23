export type Specialist = 'billing' | 'order_delivery' | 'account' | 'technical';

export interface Investigation {
  issue: string;
  specialist: Specialist;
  findings: string[];
  rootCause: string | null;
  resolution: string | null;
  requiresHuman: boolean;
  escalationReason?: string;
  dataChecked: string[];
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  specialist: Specialist;
  status: 'open' | 'resolved' | 'needs_human';
  investigation?: Investigation;
  escalated: boolean;
  interactionType?: 'conversational' | 'case_update';
  ticketId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'customer' | 'orvix';
  content: string;
  createdAt: string;
  response?: ChatResponse;
}

export interface DemoCustomer {
  id: string;
  name: string;
  detail: string;
}

export interface SupportTicket {
  _id: string;
  ticketId: string;
  customerId: string;
  customerName: string;
  subject: string;
  status: 'open' | 'resolved' | 'closed';
  messages: Array<{ role: string; content: string; createdAt: string }>;
  investigation?: Investigation;
  createdAt: string;
}
