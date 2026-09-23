import type { Specialist } from '../types/chat';

const labels: Record<Specialist, string> = {
  billing: 'Billing Support',
  order_delivery: 'Order & Delivery',
  account: 'Account Support',
  technical: 'Technical Support'
};

export function SpecialistBadge({ specialist }: { specialist: Specialist }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/15 bg-signal/5 px-2.5 py-1 text-[11px] font-bold text-signal">
      <span className="h-1.5 w-1.5 rounded-full bg-signal" />
      {labels[specialist]}
    </span>
  );
}
