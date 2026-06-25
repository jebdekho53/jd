'use client';

import type { OrderTimelineEntry } from './order-timeline-labels';
import { timelineLabel } from './order-timeline-labels';

export interface OrderTimelineProps {
  history: OrderTimelineEntry[];
  className?: string;
}

export function OrderTimeline({ history, className = '' }: OrderTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-neutral-500">No timeline events yet.</p>;
  }

  return (
    <div className={`relative space-y-0 ${className}`}>
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const label = timelineLabel(entry.status);
        const createdAt = new Date(entry.createdAt);
        const time = createdAt.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const date = createdAt.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });

        return (
          <div key={`${entry.status}-${index}-${entry.createdAt}`} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-4 top-8 h-full w-px bg-neutral-200" aria-hidden />
            )}
            <div
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold"
              aria-hidden
            >
              {index + 1}
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium text-neutral-900">{label}</p>
              <p className="text-xs text-neutral-500">
                {date} at {time}
              </p>
              {entry.note && (
                <p className="mt-0.5 text-xs italic text-neutral-500">{entry.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export * from './order-timeline-labels';
