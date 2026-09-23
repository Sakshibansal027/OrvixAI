export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2 text-xs font-medium text-slate-400">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-signal [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-signal [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-signal" />
      </span>
      {label}
    </div>
  );
}
