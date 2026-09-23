import type { SupportTicket } from '../types/chat';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function getOpenSupportTickets(signal?: AbortSignal): Promise<SupportTicket[]> {
  const response = await fetch(`${API_BASE_URL}/api/support/tickets`, { signal });
  if (!response.ok) throw new Error('Support queue could not be loaded');
  return response.json() as Promise<SupportTicket[]>;
}

export async function replyToSupportTicket(ticketId: string, message: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/support/tickets/${encodeURIComponent(ticketId)}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, agentName: 'Support Agent' })
  });
  if (!response.ok) throw new Error('Reply could not be sent');
}
