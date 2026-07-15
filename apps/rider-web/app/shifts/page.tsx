'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endShift, getCurrentShift, listShiftHistory, startShift } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';

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
          <div className="space-y-3 text-sm">
            <p>Started at <b>{new Date(current.data.startedAt).toLocaleString('en-IN')}</b></p>
            <button onClick={() => end.mutate()} disabled={end.isPending} className="h-11 w-full rounded-lg bg-red-600 font-semibold text-white disabled:opacity-50">End shift</button>
          </div>
        ) : (
          <button onClick={() => start.mutate()} disabled={start.isPending} className="h-11 w-full rounded-lg bg-emerald-600 font-semibold text-white disabled:opacity-50">Start shift</button>
        )}
      </Panel>
      <Panel title="Recent shifts">
        <ul className="space-y-2">
          {(history.data ?? []).map((shift) => (
            <li key={shift.id} className="rounded-lg bg-slate-100 p-3 text-sm">
              <b>{shift.status}</b>
              <p>{new Date(shift.startedAt).toLocaleString('en-IN')} {shift.endedAt ? `- ${new Date(shift.endedAt).toLocaleString('en-IN')}` : ''}</p>
              <p>{shift.deliveries} deliveries · ₹{Math.round(Number(shift.earnings))}</p>
            </li>
          ))}
          {history.data?.length === 0 && <li className="text-sm text-slate-500">No shift history yet.</li>}
        </ul>
      </Panel>
    </CaptainPageShell>
  );
}
