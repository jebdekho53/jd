'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Bike, Car, Footprints, Star } from 'lucide-react';
import { EmptyState, PageHeader, Pill, Stat } from '@/components/ui';

interface Rider {
  id: string;
  name: string;
  vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'SCOOTER' | 'CAR' | 'WALK';
  status: 'OFFLINE' | 'ONLINE' | 'BUSY' | 'ON_DELIVERY';
  ratingAvg: number;
  ratingCount: number;
  totalDeliveries: number;
  lastLocationAt: string | null;
  deliveries30d: number;
  completed30d: number;
  earning30d: number;
}

interface RidersResponse {
  riders: Rider[];
  totalRiders: number;
}

function RidersInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'riders'],
    queryFn: async (): Promise<RidersResponse> => {
      const res = await fetch('/api/franchise/riders');
      const json = await res.json();
      return json.data;
    },
  });

  const riders = data?.riders ?? [];
  const totalDeliveries30d = riders.reduce((s, r) => s + r.deliveries30d, 0);
  const totalEarning30d = riders.reduce((s, r) => s + r.earning30d, 0);
  const online = riders.filter((r) => r.status !== 'OFFLINE').length;
  const avgRating = riders.length
    ? riders.reduce((s, r) => s + (r.ratingCount > 0 ? r.ratingAvg : 0), 0) /
      Math.max(1, riders.filter((r) => r.ratingCount > 0).length)
    : 0;

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riders"
        subtitle="Delivery partners who have actually fulfilled orders for your stores in the last 30 days."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Riders active (30d)" value={String(data?.totalRiders ?? 0)} sub={`${online} online now`} />
        <Stat label="Deliveries (30d)" value={totalDeliveries30d.toLocaleString()} />
        <Stat label="Rider earnings (30d)" value={`₹${totalEarning30d.toLocaleString()}`} />
        <Stat label="Avg rating" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} />
      </div>

      {riders.length === 0 ? (
        <EmptyState message="No rider has delivered for your stores in the last 30 days yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Rider</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium text-right">Deliveries (30d)</th>
                <th className="px-4 py-3 font-medium text-right">Completed</th>
                <th className="px-4 py-3 font-medium text-right">Earnings (30d)</th>
                <th className="px-4 py-3 font-medium text-right">Lifetime deliveries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950">
              {riders.map((r) => (
                <tr key={r.id} className="text-slate-300">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <VehicleIcon type={r.vehicleType} />
                      <span className="font-medium text-white">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.ratingCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {r.ratingAvg.toFixed(1)}
                        <span className="text-xs text-slate-600">({r.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">{r.deliveries30d}</td>
                  <td className="px-4 py-3 text-right">{r.completed30d}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-300">
                    ₹{r.earning30d.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{r.totalDeliveries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VehicleIcon({ type }: { type: Rider['vehicleType'] }) {
  if (type === 'BICYCLE' || type === 'MOTORCYCLE' || type === 'SCOOTER')
    return <Bike className="h-4 w-4 text-slate-500" />;
  if (type === 'CAR') return <Car className="h-4 w-4 text-slate-500" />;
  return <Footprints className="h-4 w-4 text-slate-500" />;
}

function StatusPill({ status }: { status: Rider['status'] }) {
  if (status === 'ONLINE') return <Pill tone="emerald">Online</Pill>;
  if (status === 'ON_DELIVERY') return <Pill tone="violet">On delivery</Pill>;
  if (status === 'BUSY') return <Pill tone="amber">Busy</Pill>;
  return <Pill tone="slate">Offline</Pill>;
}

export default function RidersPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <RidersInner />
    </QueryClientProvider>
  );
}
