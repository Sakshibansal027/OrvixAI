import type { ChatResponse } from '../types/chat';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function sendChatMessage(customerId: string, message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, message })
  });

  if (!response.ok) {
    throw new Error('Chat request failed');
  }

  return response.json() as Promise<ChatResponse>;
}
