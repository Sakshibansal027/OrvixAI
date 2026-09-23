import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getOpenSupportTickets, replyToSupportTicket } from '../services/supportService';
import type { SupportTicket } from '../types/chat';

interface SupportInboxPageProps { onBack: () => void }

export function SupportInboxPage({ onBack }: SupportInboxPageProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = tickets.find((ticket) => ticket.ticketId === selectedId) ?? tickets[0] ?? null;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getOpenSupportTickets(signal);
      if (signal?.aborted) return;
      setTickets(result);
      setSelectedId((current) => current && result.some((ticket) => ticket.ticketId === current) ? current : result[0]?.ticketId ?? null);
      setError(null);
    } catch {
      if (!signal?.aborted) setError('Could not reach the support queue. Check the API and database connection.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [refresh]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await replyToSupportTicket(selected.ticketId, reply.trim());
      setReply('');
      await refresh();
    } catch {
      setError('Reply could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,125,244,0.09),_transparent_34%),#f5f8fc] px-3 py-3 text-ink sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-panel sm:min-h-[calc(100vh-3rem)]">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/70 px-5 py-4 sm:px-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-signal">Human support</p><h1 className="mt-1 text-lg font-extrabold">Agent inbox <span className="ml-2 rounded-full bg-signal/10 px-2 py-1 text-xs text-signal">{error ? 'unavailable' : `${tickets.length} open`}</span></h1></div>
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50">Back to customer chat</button>
        </header>
        {error && <div role="alert" className="mx-5 mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-7">{error}</div>}
        <div className="grid flex-1 lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-slate-200/80 p-4 lg:border-b-0 lg:border-r sm:p-5">
            <h2 className="px-2 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Needs a human reply</h2>
            {loading ? <p className="p-3 text-sm text-slate-400">Loading support cases…</p> : error && tickets.length === 0 ? <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">The queue will reload automatically when the support database reconnects.</p> : tickets.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">No open cases. New cases appear here when ORVIX hands an issue to support.</p> : <div className="space-y-2">{tickets.map((ticket) => <button key={ticket.ticketId} onClick={() => setSelectedId(ticket.ticketId)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.ticketId === ticket.ticketId ? 'border-signal/30 bg-signal/5' : 'border-slate-100 bg-white hover:bg-slate-50'}`}><span className="block text-sm font-bold text-ink">{ticket.customerName}</span><span className="mt-1 block text-xs text-slate-400">{ticket.ticketId} · {ticket.customerId}</span><span className="mt-2 block line-clamp-2 text-sm text-slate-600">{ticket.subject}</span></button>)}</div>}
          </aside>
          <section className="flex min-h-[500px] flex-col p-5 sm:p-7">
            {!selected ? <div className="m-auto max-w-sm text-center"><div className="text-lg font-bold text-ink">{error ? 'Support queue unavailable' : 'The queue is clear'}</div><p className="mt-2 text-sm leading-6 text-slate-500">{error ? 'Open cases will appear here as soon as the database reconnects.' : 'When a customer needs a person, ORVIX saves the case and its investigation here.'}</p></div> : <>
              <div className="border-b border-slate-100 pb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-extrabold">{selected.subject}</h2><p className="mt-1 text-sm text-slate-400">{selected.customerName} · {selected.customerId} · {selected.ticketId}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Open case</span></div></div>
              <div className="flex-1 space-y-5 overflow-y-auto py-5">
                {selected.investigation && <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-signal">ORVIX investigation · {selected.investigation.specialist.replace('_', ' ')}</p><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600">{selected.investigation.findings.map((finding) => <li key={finding}>• {finding}</li>)}</ul>{selected.investigation.rootCause && <p className="mt-3 text-sm leading-5"><strong>Root cause:</strong> {selected.investigation.rootCause}</p>}{selected.investigation.escalationReason && <p className="mt-2 text-sm leading-5"><strong>Why this needs you:</strong> {selected.investigation.escalationReason}</p>}</div>}
                {selected.messages.map((message, index) => <div key={`${message.createdAt}-${index}`} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'customer' ? 'ml-auto bg-[#11284a] text-white' : 'bg-slate-50 text-slate-700'}`}><p className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60">{message.role === 'customer' ? selected.customerName : message.role === 'agent' ? 'Support' : 'ORVIX'}</p>{message.content}</div>)}
              </div>
              <form onSubmit={handleReply} className="flex gap-2 border-t border-slate-100 pt-4"><input value={reply} onChange={(event) => setReply(event.target.value)} aria-label="Reply to customer" placeholder="Write a human support reply…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-signal/50"/><button disabled={!reply.trim() || sending} className="rounded-xl bg-signal px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{sending ? 'Sending…' : 'Send & resolve'}</button></form>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}
