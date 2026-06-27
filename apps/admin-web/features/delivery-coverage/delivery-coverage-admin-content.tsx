'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { adminFetch } from '@/services/api/admin-client';
import { Input, Button } from '@/design-system';
import { OpsMapOverlay } from '@/features/maps/ops-map-overlay';
import { useOperationsMapQuery } from '@/features/maps/use-operations-map';
import { useGoogleMaps } from '@jebdekho/google-maps';

export function DeliveryCoverageAdminContent() {
  const [pincode, setPincode] = useState('');
  const { isConfigured, isLoaded } = useGoogleMaps();
  const { data: opsMap } = useOperationsMapQuery(60_000);

  const { data: overview } = useQuery({
    queryKey: ['admin', 'delivery-coverage', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: Record<string, unknown> }>(
        '/api/admin/delivery-coverage/overview',
      );
      return res.data;
    },
  });

  const { data: searchResult, refetch } = useQuery({
    queryKey: ['admin', 'delivery-coverage', 'search', pincode],
    enabled: false,
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: Array<{ pincode: string; store: { name: string } }> } }>(
        `/api/admin/delivery-coverage?pincode=${encodeURIComponent(pincode)}&limit=50`,
      );
      return res.data;
    },
  });

  const o = overview as {
    coveragePercent?: number;
    servedPincodeCount?: number;
    activeMasterPincodes?: number;
    unservedPincodeCount?: number;
    topCoveredAreas?: Array<{ pincode: string; storeCount: number }>;
    leastCoveredAreas?: Array<{ pincode: string; storeCount: number }>;
  } | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <MapPin className="h-6 w-6" /> Delivery Coverage
        </h1>
        <p className="text-sm text-slate-500">Platform-wide pincode coverage heatmap and analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Coverage %" value={`${o?.coveragePercent ?? 0}%`} />
        <Stat label="Served pincodes" value={String(o?.servedPincodeCount ?? 0)} />
        <Stat label="Master pincodes" value={String(o?.activeMasterPincodes ?? 0)} />
        <Stat label="Unserved" value={String(o?.unservedPincodeCount ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HeatList title="Top covered areas" items={o?.topCoveredAreas ?? []} />
        <HeatList title="Least covered areas" items={o?.leastCoveredAreas ?? []} />
      </div>

      {opsMap && isConfigured && isLoaded && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-medium">Store coverage map</h3>
          <OpsMapOverlay data={opsMap} showRiders={false} showUnassigned={false} showZones />
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <div className="flex gap-2">
          <Input placeholder="Search pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          <Button onClick={() => refetch()}>Search</Button>
        </div>
        <div className="mt-4 space-y-2">
          {(searchResult?.items ?? []).map((row, i) => (
            <div key={`${row.pincode}-${i}`} className="flex items-center justify-between border-b py-2 text-sm">
              <span className="font-medium">{row.pincode}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{row.store.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function HeatList({
  title,
  items,
}: {
  title: string;
  items: Array<{ pincode: string; storeCount: number }>;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-3 font-medium">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.pincode} className="flex justify-between text-sm">
            <span>{item.pincode}</span>
            <span className="text-slate-500">{item.storeCount} stores</span>
          </div>
        ))}
      </div>
    </div>
  );
}
