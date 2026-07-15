'use client';

import { useQuery } from '@tanstack/react-query';
import { listIncentives } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';

export default function IncentivesPage() {
  const incentives = useQuery({ queryKey: ['rider', 'incentives'], queryFn: listIncentives });
  return (
    <CaptainPageShell title="Incentives" subtitle="Track active quests and rewards.">
      <Panel title="Active quests">
        <div className="space-y-3">
          {(incentives.data ?? []).map((item) => {
            const pct = item.targetDeliveries > 0 ? Math.min(100, Math.round((item.progress.deliveries / item.targetDeliveries) * 100)) : 0;
            return (
              <div key={item.id} className="rounded-lg bg-slate-100 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <b>{item.title}</b>
                  <b className="text-emerald-700">₹{Math.round(item.rewardAmount)}</b>
                </div>
                {item.description && <p className="mt-1 text-slate-600">{item.description}</p>}
                <div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                <p className="mt-1 text-xs text-slate-500">{item.progress.deliveries}/{item.targetDeliveries} deliveries · {item.progress.remaining} left</p>
              </div>
            );
          })}
          {incentives.data?.length === 0 && <p className="text-sm text-slate-500">No active incentives right now.</p>}
        </div>
      </Panel>
    </CaptainPageShell>
  );
}
