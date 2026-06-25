'use client';

import { CheckCircle2, Package, Store, Truck } from 'lucide-react';

const STAGES = [
  { key: 'waiting', label: 'Waiting for pickup', icon: Store },
  { key: 'rider_to_store', label: 'Rider on the way to store', icon: Truck },
  { key: 'at_store', label: 'Rider at store', icon: Store },
  { key: 'out_for_delivery', label: 'Picked up', icon: Package },
  { key: 'arriving', label: 'Arriving', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
] as const;

const STAGE_ORDER = STAGES.map((s) => s.key);

interface DeliveryProgressTrackerProps {
  stage: string;
}

export function DeliveryProgressTracker({ stage }: DeliveryProgressTrackerProps) {
  const currentIdx = Math.max(0, STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]));

  return (
    <div className="space-y-0">
      {STAGES.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                      ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`my-1 h-6 w-0.5 ${done ? 'bg-brand-500' : 'bg-border'}`} />
              )}
            </div>
            <div className="pb-4 pt-1">
              <p className={`text-sm ${active ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </p>
              {active && !done && (
                <p className="text-xs text-brand-600">In progress</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
