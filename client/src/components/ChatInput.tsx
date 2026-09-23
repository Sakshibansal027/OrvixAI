import { useState } from 'react';

interface ChatInputProps {
  disabled: boolean;
  onSend: (message: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  function submit() {
    const message = value.trim();
    if (!message || disabled) return;
    onSend(message);
    setValue('');
  }

  return (
    <div className="border-t border-slate-200/80 bg-white/90 p-4 sm:p-5">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-mist/70 p-2 pl-4 transition focus-within:border-signal/50 focus-within:ring-4 focus-within:ring-signal/5">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder="Describe what happened..."
          className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition hover:bg-signal disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
        </button>
      </div>
      <div className="mt-2 text-center text-[10px] font-medium text-slate-400">ORVIX checks verified company records before responding</div>
    </div>
  );
}
