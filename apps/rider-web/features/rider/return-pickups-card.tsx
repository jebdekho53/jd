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
      <p className="mb-2 text-sm font-bold text-rider-text">Return pickups ({list.length})</p>
      <ul className="space-y-3">
        {list.map((p) => {
          const step = nextStep(p.status);
          const toStore = p.status === 'PICKED_UP';
          const target = toStore
            ? { lat: p.store.latitude ?? p.dropLat ?? 0, lng: p.store.longitude ?? p.dropLng ?? 0 }
            : { lat: p.pickupLat, lng: p.pickupLng };
          return (
            <li key={p.id} className="overflow-hidden rounded-2xl border border-rider-border bg-rider-surface">
              <div className="flex items-center justify-between border-b border-rider-border px-4 py-2">
                <span className="font-bold text-rider-text">Return · {p.claim.claimNumber}</span>
                <span className="rounded-full bg-rider-accent/15 px-2 py-0.5 text-[11px] font-bold text-rider-accent">
                  {p.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-rider-accent">●</span>
                  <p className="font-semibold text-rider-text">Collect from customer</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-rider-online">●</span>
                  <p className="font-semibold text-rider-text">Drop at {p.store.name}</p>
                </div>
                <div className="flex items-center justify-between pt-1 text-rider-muted">
                  <span>Reason: {p.claim.reason.replace(/_/g, ' ').toLowerCase()}</span>
                  {p.riderEarning != null && (
                    <span className="font-bold text-rider-online">You earn ₹{Math.round(p.riderEarning)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 border-t border-rider-border p-3">
                <a
                  href={mapsHref(target.lat, target.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-rider-text"
                >
                  Navigate {toStore ? 'to store' : 'to customer'}
                </a>
                {p.status === 'ASSIGNED' && (
                  <button
                    onClick={() => act.mutate({ id: p.id, verb: 'decline' })}
                    disabled={act.isPending}
                    className="h-11 flex-1 rounded-xl bg-rider-danger/15 text-sm font-bold text-rider-danger disabled:opacity-60"
                  >
                    Decline
                  </button>
                )}
                {step && (
                  <button
                    onClick={() => act.mutate({ id: p.id, verb: step.verb })}
                    disabled={act.isPending}
                    className="h-11 flex-[1.6] rounded-xl bg-rider-accent text-sm font-bold text-rider-accent-foreground disabled:opacity-60"
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
