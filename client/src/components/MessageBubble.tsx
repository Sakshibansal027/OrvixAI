import type { ChatMessage } from '../types/chat';
import { InvestigationCard } from './InvestigationCard';
import { SpecialistBadge } from './SpecialistBadge';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isCustomer = message.role === 'customer';

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] sm:max-w-[76%] ${isCustomer ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isCustomer ? 'text-slate-400' : 'text-signal'}`}>
          {!isCustomer && <span className="h-1.5 w-1.5 rounded-full bg-signal" />}
          {isCustomer ? 'You' : 'ORVIX'}
        </div>
        <div className={`mt-1.5 rounded-2xl px-4 py-3 text-sm leading-6 shadow-bubble ${isCustomer ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-700'}`}>
          {message.content}
        </div>
        {!isCustomer && message.response && (
          <div className="w-full">
            <div className="mt-3 flex items-center gap-2 px-1">
              <SpecialistBadge specialist={message.response.specialist} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-mint">{message.response.status === 'resolved' ? 'Resolved' : 'Human support needed'}</span>
            </div>
            <InvestigationCard investigation={message.response.investigation} />
          </div>
        )}
        <div className="mt-1 px-1 text-[10px] text-slate-300">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  );
}
