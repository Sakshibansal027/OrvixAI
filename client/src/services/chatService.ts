import type { ChatResponse } from '../types/chat';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function sendChatMessage(customerId: string, message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, message })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'Chat request failed');
  }

  return response.json() as Promise<ChatResponse>;
}

export interface ConversationHistory {
  conversationId: string | null;
  messages: Array<{ role: 'customer' | 'assistant'; content: string; createdAt: string }>;
}

export async function getConversationHistory(customerId: string, signal?: AbortSignal): Promise<ConversationHistory> {
  const response = await fetch(`${API_BASE_URL}/api/chat/${encodeURIComponent(customerId)}`, { signal });
  if (!response.ok) throw new Error('Conversation history could not be loaded');
  return response.json() as Promise<ConversationHistory>;
}
