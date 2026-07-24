'use client';

import { useQuery } from '@tanstack/react-query';
import { listIncentives } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { QueryList } from '@/design-system/primitives';

export default function IncentivesPage() {
  const incentives = useQuery({ queryKey: ['rider', 'incentives'], queryFn: listIncentives });
  return (
    <CaptainPageShell title="Incentives" subtitle="Track active quests and rewards.">
      <Panel title="Active quests">
        <QueryList query={incentives} empty="No active incentives right now." errorTitle="Could not load your incentives">
          {(items) => (
            <div className="space-y-3">
              {items.map((item) => {
                const pct = item.targetDeliveries > 0 ? Math.min(100, Math.round((item.progress.deliveries / item.targetDeliveries) * 100)) : 0;
                return (
                  <div key={item.id} className="rounded-xl bg-white/5 p-3 text-sm text-rider-text">
                    <div className="flex justify-between gap-3">
                      <b>{item.title}</b>
                      <b className="text-rider-accent">₹{Math.round(item.rewardAmount)}</b>
                    </div>
                    {item.description && <p className="mt-1 text-rider-muted">{item.description}</p>}
                    <div className="mt-3 h-2 rounded-full bg-rider-border"><div className="h-2 rounded-full bg-rider-accent" style={{ width: `${pct}%` }} /></div>
                    <p className="mt-1 text-xs text-rider-muted">{item.progress.deliveries}/{item.targetDeliveries} deliveries · {item.progress.remaining} left</p>
                  </div>
                );
              })}
            </div>
          )}
        </QueryList>
      </Panel>
    </CaptainPageShell>
  );
}
