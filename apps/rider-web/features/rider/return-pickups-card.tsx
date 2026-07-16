'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getReturnPickups, returnPickupAction, type ReturnPickup } from '@/lib/api';

const mapsHref = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/** Next action + label for a return pickup's current status. */
function nextStep(status: ReturnPickup['status']): { verb: 'accept' | 'picked-up' | 'completed'; label: string } | null {
  switch (status) {
    case 'ASSIGNED': return { verb: 'accept', label: 'Accept pickup' };
    case 'ACCEPTED': return { verb: 'picked-up', label: 'Collected from customer' };
    case 'PICKED_UP': return { verb: 'completed', label: 'Delivered to store' };
    default: return null;
  }
}

export function ReturnPickupsCard() {
  const qc = useQueryClient();
  const { data: pickups } = useQuery({
    queryKey: ['rider', 'return-pickups'],
    queryFn: getReturnPickups,
    refetchInterval: 20_000,
  });

  const act = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: 'accept' | 'picked-up' | 'completed' | 'decline' }) =>
      returnPickupAction(id, verb),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'return-pickups'] }),
  });

  const list = pickups ?? [];
  if (list.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">Return pickups ({list.length})</p>
      <ul className="space-y-3">
        {list.map((p) => {
          const step = nextStep(p.status);
          const toStore = p.status === 'PICKED_UP';
          const target = toStore
            ? { lat: p.store.latitude ?? p.dropLat ?? 0, lng: p.store.longitude ?? p.dropLng ?? 0 }
            : { lat: p.pickupLat, lng: p.pickupLng };
          return (
            <li key={p.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="font-semibold">Return · {p.claim.claimNumber}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  {p.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">●</span>
                  <p className="font-medium">Collect from customer</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">●</span>
                  <p className="font-medium">Drop at {p.store.name}</p>
                </div>
                <div className="flex items-center justify-between pt-1 text-slate-500">
                  <span>Reason: {p.claim.reason.replace(/_/g, ' ').toLowerCase()}</span>
                  {p.riderEarning != null && (
                    <span className="font-semibold text-emerald-600">You earn ₹{Math.round(p.riderEarning)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 border-t p-3">
                <a
                  href={mapsHref(target.lat, target.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium"
                >
                  Navigate {toStore ? 'to store' : 'to customer'}
                </a>
                {p.status === 'ASSIGNED' && (
                  <button
                    onClick={() => act.mutate({ id: p.id, verb: 'decline' })}
                    disabled={act.isPending}
                    className="h-11 flex-1 rounded-lg bg-slate-100 text-sm font-medium text-red-600 disabled:opacity-60"
                  >
                    Decline
                  </button>
                )}
                {step && (
                  <button
                    onClick={() => act.mutate({ id: p.id, verb: step.verb })}
                    disabled={act.isPending}
                    className="h-11 flex-[1.6] rounded-lg bg-slate-900 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {step.label}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
