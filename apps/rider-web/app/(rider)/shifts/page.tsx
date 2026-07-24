'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endShift, getCurrentShift, listShiftHistory, startShift } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { QueryList } from '@/design-system/primitives';

export default function ShiftsPage() {
  const qc = useQueryClient();
  const current = useQuery({ queryKey: ['rider', 'shifts', 'current'], queryFn: getCurrentShift });
  const history = useQuery({ queryKey: ['rider', 'shifts', 'history'], queryFn: listShiftHistory });
  const start = useMutation({ mutationFn: () => startShift(), onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'shifts'] }) });
  const end = useMutation({ mutationFn: () => endShift(), onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'shifts'] }) });

  return (
    <CaptainPageShell title="Shifts" subtitle="Track attendance and working time.">
      <Panel title="Current shift">
        {current.data ? (
          <div className="space-y-3 text-sm text-rider-text">
            <p>Started at <b>{new Date(current.data.startedAt).toLocaleString('en-IN')}</b></p>
            <button onClick={() => end.mutate()} disabled={end.isPending} className="h-12 w-full rounded-xl bg-rider-danger font-bold text-white disabled:opacity-50">End shift</button>
          </div>
        ) : (
          <button onClick={() => start.mutate()} disabled={start.isPending} className="h-12 w-full rounded-xl bg-rider-online font-bold text-rider-bg disabled:opacity-50">Start shift</button>
        )}
      </Panel>
      <Panel title="Recent shifts">
        <QueryList query={history} empty="No shift history yet." errorTitle="Could not load your shift history">
          {(shifts) => (
            <ul className="space-y-2">
              {shifts.map((shift) => (
                <li key={shift.id} className="rounded-xl bg-white/5 p-3 text-sm text-rider-text">
                  <b>{shift.status}</b>
                  <p>{new Date(shift.startedAt).toLocaleString('en-IN')} {shift.endedAt ? `- ${new Date(shift.endedAt).toLocaleString('en-IN')}` : ''}</p>
                  <p>{shift.deliveries} deliveries · ₹{Math.round(Number(shift.earnings))}</p>
                </li>
              ))}
            </ul>
          )}
        </QueryList>
      </Panel>
    </CaptainPageShell>
  );
}
