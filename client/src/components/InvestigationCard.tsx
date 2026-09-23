import type { Investigation } from '../types/chat';
import { SpecialistBadge } from './SpecialistBadge';

function CheckIcon() {
  return <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/10 text-[10px] font-black text-mint">✓</span>;
}

export function InvestigationCard({ investigation, ticketId }: { investigation: Investigation; ticketId?: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink">Investigation complete</div>
          <div className="mt-1 text-[11px] text-slate-400">Verified business records · {investigation.dataChecked.length} checks</div>
        </div>
        <SpecialistBadge specialist={investigation.specialist} />
      </div>

      <div className="space-y-2 px-4 py-3">
        {investigation.findings.map((finding) => (
          <div className="flex gap-2 text-xs leading-5 text-slate-600" key={finding}>
            <CheckIcon />
            <span>{finding}</span>
          </div>
        ))}
      </div>

      {(investigation.rootCause || investigation.resolution) && (
        <div className="grid gap-3 border-t border-slate-100 bg-mist/60 px-4 py-4 sm:grid-cols-2">
          {investigation.rootCause && (
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Root cause</div>
              <div className="mt-1.5 text-xs font-semibold leading-5 text-ink">{investigation.rootCause}</div>
            </div>
          )}
          {investigation.resolution && (
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Resolution</div>
              <div className="mt-1.5 text-xs font-semibold leading-5 text-ink">{investigation.resolution}</div>
            </div>
          )}
        </div>
      )}

      {investigation.requiresHuman && (
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          A support case has been opened with the investigation and conversation context, so you won’t need to repeat everything.{ticketId ? ` Reference: ${ticketId}.` : ''}
        </div>
      )}
    </div>
  );
}
