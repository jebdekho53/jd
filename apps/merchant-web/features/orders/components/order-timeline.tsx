import { cn } from '@/lib/cn';
import type { OrderTimelineEntry } from '@/types/order';

export function OrderTimeline({ entries }: { entries: OrderTimelineEntry[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
      {entries.map((e, i) => (
        <li key={i} className="relative">
          <div className="absolute -left-[22px] h-3 w-3 rounded-full border-2 border-white bg-brand-500 shadow" />
          <div>
            <p className="text-sm font-medium text-slate-800">{e.status.replace(/_/g, ' ')}</p>
            {e.note && <p className="text-xs text-slate-500">{e.note}</p>}
            <p className="text-xs text-slate-400">
              {new Date(e.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
