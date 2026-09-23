import { useEffect, useMemo, useState } from 'react';
import { ChatInput } from '../components/ChatInput';
import { LoadingState } from '../components/LoadingState';
import { MessageBubble } from '../components/MessageBubble';
import { OrvixMark } from '../components/OrvixMark';
import { getConversationHistory, sendChatMessage } from '../services/chatService';
import type { ChatMessage, ChatResponse, DemoCustomer } from '../types/chat';

const customers: DemoCustomer[] = [
  { id: 'CUS_1001', name: 'Rahul Sharma', detail: 'Premium customer' },
  { id: 'CUS_1002', name: 'Aisha Mehta', detail: 'Standard customer' },
  { id: 'CUS_1003', name: 'Vikram Rao', detail: 'Account verification needed' }
];

const welcomeMessage = (customer: DemoCustomer): ChatMessage => ({
  id: `welcome-${customer.id}`,
  role: 'orvix',
  content: `Hi ${customer.name.split(' ')[0]}, I’m ORVIX. Tell me what went wrong and I’ll check the relevant support records to help resolve it.`,
  createdAt: new Date().toISOString()
});

export function ChatPage({ onOpenSupport }: { onOpenSupport: () => void }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [sessions, setSessions] = useState<Record<string, ChatMessage[]>>(() => ({ [customers[0].id]: [welcomeMessage(customers[0])] }));
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [loadingLabel, setLoadingLabel] = useState('Understanding your issue...');
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0], [selectedCustomerId]);
  const messages = sessions[selectedCustomerId] ?? [welcomeMessage(selectedCustomer)];

  useEffect(() => {
    const controller = new AbortController();
    setIsHistoryLoading(true);
    getConversationHistory(selectedCustomerId, controller.signal)
      .then((history) => {
        if (controller.signal.aborted) return;
        const restoredMessages: ChatMessage[] = history.messages.map((message, index) => ({
          id: `history-${selectedCustomerId}-${index}`,
          role: message.role === 'assistant' ? 'orvix' : 'customer',
          content: message.content,
          createdAt: message.createdAt
        }));
        setSessions((current) => ({ ...current, [selectedCustomerId]: restoredMessages.length ? restoredMessages : [welcomeMessage(selectedCustomer)] }));
        if (history.conversationId) {
          setConversationIds((current) => ({ ...current, [selectedCustomerId]: history.conversationId! }));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSessions((current) => current[selectedCustomerId] ? current : { ...current, [selectedCustomerId]: [welcomeMessage(selectedCustomer)] });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      });
    return () => controller.abort();
  }, [selectedCustomer, selectedCustomerId]);

  useEffect(() => {
    if (!isLoading) return;
    const labels = ['Understanding your issue...', 'Checking your account...', 'Investigating the issue...'];
    let index = 0;
    setLoadingLabel(labels[index]);
    const timer = window.setInterval(() => {
      index = (index + 1) % labels.length;
      setLoadingLabel(labels[index]);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  async function handleSend(message: string) {
    if (isLoading) return;
    setError(null);
    const customerMessage: ChatMessage = { id: crypto.randomUUID(), role: 'customer', content: message, createdAt: new Date().toISOString() };
    setSessions((current) => ({ ...current, [selectedCustomerId]: [...(current[selectedCustomerId] ?? []), customerMessage] }));
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage(selectedCustomerId, message);
      const orvixMessage: ChatMessage = { id: crypto.randomUUID(), role: 'orvix', content: response.message, createdAt: new Date().toISOString(), response };
      setConversationIds((current) => ({ ...current, [selectedCustomerId]: response.conversationId }));
      setSessions((current) => ({ ...current, [selectedCustomerId]: [...(current[selectedCustomerId] ?? []), orvixMessage] }));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'ORVIX is temporarily unable to connect to support services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,125,244,0.09),_transparent_34%),#f5f8fc] px-3 py-3 text-ink sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/70 shadow-panel backdrop-blur sm:min-h-[calc(100vh-3rem)] lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-white/55 p-5 sm:p-6 lg:w-[290px] lg:border-b-0 lg:border-r">
          <OrvixMark />
          <div className="mt-8 hidden lg:block">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Live support</div>
            <p className="mt-3 text-sm leading-6 text-slate-500">Autonomous Customer Support &amp; Root-Cause Engine</p>
          </div>

          <div className="mt-6 lg:mt-auto">
            <label htmlFor="customer" className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Demo customer</label>
            <div className="relative mt-2">
              <select id="customer" value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-9 text-sm font-semibold text-ink outline-none transition focus:border-signal/50 focus:ring-4 focus:ring-signal/5">
                {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.id}</option>)}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <div className="mt-2 flex items-center gap-2 px-1 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-mint" />{selectedCustomer.detail}</div>
          </div>
        </aside>

        <section className="flex min-h-[650px] flex-1 flex-col bg-white/35">
          <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/60 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-signal/10 text-signal">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3.7-.8L4 20l1.3-3.7A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></svg>
              </div>
              <div><h1 className="text-sm font-extrabold text-ink sm:text-base">ORVIX Support Intelligence</h1><div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-mint" />Online and ready to investigate</div></div>
            </div>
            <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Active customer</div><div className="mt-1 text-xs font-bold text-ink">{selectedCustomer.id}</div></div><button onClick={onOpenSupport} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-signal/30 hover:text-signal sm:px-4 sm:text-sm">Agent inbox</button></div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {messages.map((message) => <MessageBubble message={message} key={message.id} />)}
            {isHistoryLoading && <LoadingState label="Loading conversation..." />}
            {isLoading && <LoadingState label={loadingLabel} />}
            {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</div>}
            {conversationIds[selectedCustomerId] && <div className="text-center text-[10px] font-medium text-slate-300">Conversation {conversationIds[selectedCustomerId]}</div>}
          </div>
          <ChatInput disabled={isLoading || isHistoryLoading} onSend={handleSend} />
        </section>
      </div>
    </main>
  );
}
