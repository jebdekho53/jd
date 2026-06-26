'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Upload } from 'lucide-react';
import { useStoreStore } from '@/store/store-store';
import { LocationSearchInput } from '@/features/locations/components/location-search-input';
import { merchantFetch } from '@/services/api/merchant-client';
import { Button } from '@/design-system/primitives';

interface DeliveryArea {
  id: string;
  pincode: string;
  city: string | null;
  state: string | null;
  deliveryFee: number | null;
  minimumOrder: number | null;
  estimatedMinutes: number | null;
  priority: number;
  isActive: boolean;
}

export function DeliveryCoverageContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [bulkInput, setBulkInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'delivery-coverage', storeId, search],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: { items: DeliveryArea[]; coverageCount: number; maxAreas: number } }>(
        `/api/merchant/stores/${storeId}/delivery-coverage?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      );
      return res.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (pincode: string) =>
      merchantFetch(`/api/merchant/stores/${storeId}/delivery-coverage`, {
        method: 'POST',
        body: JSON.stringify({ pincode }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] }),
  });

  const bulkMutation = useMutation({
    mutationFn: (pincodes: string[]) =>
      merchantFetch(`/api/merchant/stores/${storeId}/delivery-coverage/bulk`, {
        method: 'POST',
        body: JSON.stringify({ pincodes }),
      }),
    onSuccess: () => {
      setBulkInput('');
      qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (areaId: string) =>
      merchantFetch(`/api/merchant/stores/${storeId}/delivery-coverage/${areaId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] }),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) =>
      merchantFetch(`/api/merchant/stores/${storeId}/delivery-coverage/import`, {
        method: 'POST',
        body: JSON.stringify({ csv }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] }),
  });

  const bulkPincodes = useMemo(
    () => bulkInput.split(/[\s,]+/).map((p) => p.trim()).filter((p) => /^\d{6}$/.test(p)),
    [bulkInput],
  );

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store from the sidebar.</p>;
  }

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Coverage count</p>
          <p className="text-2xl font-semibold">{data?.coverageCount ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Maximum allowed</p>
          <p className="text-2xl font-semibold">{data?.maxAreas ?? 50}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Store</p>
          <p className="text-lg font-medium">{currentStore?.name}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <h3 className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Add pincode</h3>
          <LocationSearchInput
            onSelect={(item) => {
              if (item.pincode) addMutation.mutate(item.pincode);
            }}
          />
        </div>
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <h3 className="font-medium">Bulk add</h3>
          <textarea
            className="w-full rounded-lg border p-2 text-sm"
            rows={3}
            placeholder="201206, 201204, 110094"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
          />
          <Button
            type="button"
            disabled={bulkPincodes.length === 0 || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate(bulkPincodes)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {bulkPincodes.length} pincodes
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="max-w-xs rounded-lg border px-3 py-2 text-sm"
          placeholder="Search coverage…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          importMutation.mutate(await file.text());
        }} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> CSV import
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Pincode</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : (data?.items ?? []).map((area) => (
              <tr key={area.id} className="border-t">
                <td className="px-4 py-3 font-medium">{area.pincode}</td>
                <td className="px-4 py-3">{area.city ?? '—'}</td>
                <td className="px-4 py-3">{area.deliveryFee ?? '—'}</td>
                <td className="px-4 py-3">{area.minimumOrder ?? '—'}</td>
                <td className="px-4 py-3">{area.estimatedMinutes ? `${area.estimatedMinutes} min` : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMutation.mutate(area.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
