export function OrvixMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-3'}>
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-ink shadow-lg shadow-ink/15">
        <div className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-signal/80 blur-sm" />
        <div className="absolute -bottom-3 -left-2 h-7 w-7 rounded-full bg-mint/70 blur-sm" />
        <span className="relative text-sm font-black tracking-tight text-white">O</span>
      </div>
      <div>
        <div className="text-[17px] font-extrabold tracking-[0.18em] text-ink">ORVIX</div>
        {!compact && <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Support intelligence</div>}
      </div>
    </div>
  );
}
