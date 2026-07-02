'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Upload } from 'lucide-react';
import { GoogleStoreMap, useGoogleMaps, type AddressLocationValue } from '@jebdekho/google-maps';
import { useStoreStore } from '@/store/store-store';
import { MerchantAddressPicker } from '@/components/google-maps/merchant-address-picker';
import { ApiError, merchantFetch } from '@/services/api/merchant-client';
import { useStoreQuery } from '@/hooks/use-stores';
import { Button } from '@/design-system/primitives';
import {
  DUPLICATE_COVERAGE_MESSAGE,
  friendlyCoverageErrorMessage,
  getCoverageAddState,
  normalizeCoveragePincode,
  parseUniqueCoveragePincodes,
  splitCoveragePincodes,
  updateCoverageSelectionFromMap,
} from '@/lib/delivery-coverage/coverage-selection';

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
  const [pickerPincode, setPickerPincode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Partial<AddressLocationValue> | null>(null);
  const [coverageMessage, setCoverageMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const { data: storeDetail } = useStoreQuery(storeId ?? '');
  const storeLat = storeDetail?.latitude ?? 28.6139;
  const storeLng = storeDetail?.longitude ?? 77.209;
  const { isConfigured, isLoaded } = useGoogleMaps();

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

  const { data: allCoverageData } = useQuery({
    queryKey: ['merchant', 'delivery-coverage', storeId, 'all'],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: { items: DeliveryArea[]; coverageCount: number; maxAreas: number } }>(
        `/api/merchant/stores/${storeId}/delivery-coverage?limit=200`,
      );
      return res.data;
    },
  });

  const existingAreas = allCoverageData?.items ?? data?.items ?? [];
  const existingPincodes = useMemo(
    () => new Set(existingAreas.map((area) => area.pincode)),
    [existingAreas],
  );
  const selectedPincode = normalizeCoveragePincode(pickerPincode || selectedLocation?.pincode);
  const selectedAddState = useMemo(
    () => getCoverageAddState(selectedPincode, existingPincodes),
    [existingPincodes, selectedPincode],
  );
  const selectedArea = selectedPincode
    ? existingAreas.find((area) => area.pincode === selectedPincode)
    : undefined;
  const selectedLabel =
    selectedLocation?.locality ||
    [selectedArea?.city, selectedArea?.state].filter(Boolean).join(', ') ||
    (selectedLocation?.lat != null && selectedLocation.lng != null
      ? `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
      : '');

  const addMutation = useMutation({
    mutationFn: (pincode: string) =>
      merchantFetch(`/api/merchant/stores/${storeId}/delivery-coverage`, {
        method: 'POST',
        body: JSON.stringify({ pincode }),
      }),
    onMutate: () => setCoverageMessage(null),
    onSuccess: (_data, pincode) => {
      setCoverageMessage({ type: 'success', text: `${pincode} added to delivery coverage.` });
      setPickerPincode('');
      setSelectedLocation(null);
      qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] });
    },
    onError: (err) => {
      const status = err instanceof ApiError ? err.status : 0;
      const fallback = err instanceof Error ? err.message : undefined;
      setCoverageMessage({ type: 'error', text: friendlyCoverageErrorMessage(status, fallback) });
      if (status === 409) qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (pincodes: string[]) =>
      merchantFetch(`/api/merchant/stores/${storeId}/delivery-coverage/bulk`, {
        method: 'POST',
        body: JSON.stringify({ pincodes }),
      }),
    onSuccess: () => {
      setBulkInput('');
      setCoverageMessage({ type: 'success', text: 'Delivery coverage updated.' });
      qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] });
    },
    onError: (err) => {
      const status = err instanceof ApiError ? err.status : 0;
      const fallback = err instanceof Error ? err.message : undefined;
      setCoverageMessage({ type: 'error', text: friendlyCoverageErrorMessage(status, fallback) });
      if (status === 409) qc.invalidateQueries({ queryKey: ['merchant', 'delivery-coverage', storeId] });
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

  const bulkPincodes = useMemo(() => parseUniqueCoveragePincodes(bulkInput), [bulkInput]);
  const bulkSplit = useMemo(
    () => splitCoveragePincodes(bulkPincodes, existingPincodes),
    [bulkPincodes, existingPincodes],
  );

  const handleCoverageSelection = (selection: AddressLocationValue) => {
    const next = updateCoverageSelectionFromMap(
      {
        locality: selectedLocation?.locality,
        city: selectedLocation?.city,
        state: selectedLocation?.state,
        pincode: selectedLocation?.pincode,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng,
      },
      selection,
    );
    setSelectedLocation(next);
    setPickerPincode(next.pincode);
    const nextState = getCoverageAddState(next.pincode, existingPincodes);
    if (nextState.alreadyAdded) {
      setCoverageMessage({ type: 'info', text: DUPLICATE_COVERAGE_MESSAGE });
      setSearch(nextState.pincode);
    } else if (nextState.isValid) {
      setCoverageMessage(null);
    } else {
      setCoverageMessage({
        type: 'info',
        text: 'Could not detect pincode for this location. Enter pincode manually to add coverage.',
      });
    }
  };

  const handleManualPincodeChange = (pincode: string) => {
    const normalized = pincode.replace(/\D/g, '').slice(0, 6);
    setPickerPincode(normalized);
    setSelectedLocation((current) => ({
      locality: current?.locality ?? '',
      city: current?.city ?? '',
      state: current?.state ?? '',
      lat: current?.lat ?? storeLat,
      lng: current?.lng ?? storeLng,
      pincode: normalized,
    }));
    const nextState = getCoverageAddState(normalized, existingPincodes);
    if (nextState.alreadyAdded) {
      setCoverageMessage({ type: 'info', text: DUPLICATE_COVERAGE_MESSAGE });
      setSearch(nextState.pincode);
    } else {
      setCoverageMessage(null);
    }
  };

  const handleAddSelected = () => {
    if (!selectedAddState.canAdd) {
      if (selectedAddState.alreadyAdded) {
        setCoverageMessage({ type: 'info', text: DUPLICATE_COVERAGE_MESSAGE });
        setSearch(selectedAddState.pincode);
      }
      return;
    }
    addMutation.mutate(selectedAddState.pincode);
  };

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
          <MerchantAddressPicker
            searchLabel="Search area to add pincode"
            value={{
              pincode: pickerPincode,
              locality: selectedLocation?.locality ?? '',
              city: selectedLocation?.city ?? '',
              state: selectedLocation?.state ?? '',
              lat: selectedLocation?.lat ?? storeLat,
              lng: selectedLocation?.lng ?? storeLng,
            }}
            onChange={handleCoverageSelection}
          />
          <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                aria-label="Selected delivery pincode"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter pincode manually"
                value={pickerPincode}
                onChange={(e) => handleManualPincodeChange(e.target.value)}
              />
              <Button
                type="button"
                disabled={!selectedAddState.canAdd || addMutation.isPending}
                onClick={handleAddSelected}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add pincode
              </Button>
            </div>
            {selectedPincode ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>Selected: PIN {selectedPincode}{selectedLabel ? ` · ${selectedLabel}` : ''}</span>
                {selectedAddState.alreadyAdded ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Already added
                  </span>
                ) : null}
              </div>
            ) : null}
            {coverageMessage ? (
              <p
                className={
                  coverageMessage.type === 'error'
                    ? 'text-sm text-red-600'
                    : coverageMessage.type === 'success'
                      ? 'text-sm text-emerald-700'
                      : 'text-sm text-amber-700'
                }
              >
                {coverageMessage.text}
              </p>
            ) : null}
          </div>
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
          <p className="text-xs text-slate-500">
            {bulkSplit.alreadyAdded.length} already added, {bulkSplit.readyToAdd.length} ready to add
          </p>
          <Button
            type="button"
            disabled={bulkSplit.readyToAdd.length === 0 || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate(bulkSplit.readyToAdd)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {bulkSplit.readyToAdd.length} pincodes
          </Button>
        </div>
      </div>

      {storeDetail?.latitude != null && storeDetail.longitude != null && (
        <div className="mb-6 rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-medium">Coverage map</h3>
          {isConfigured && isLoaded ? (
            <GoogleStoreMap
              buyerLat={storeLat}
              buyerLng={storeLng}
              stores={[{ id: storeDetail.id, name: storeDetail.name, lat: storeLat, lng: storeLng }]}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Store at {storeLat.toFixed(4)}, {storeLng.toFixed(4)} · {data?.coverageCount ?? 0} pincodes covered
            </p>
          )}
        </div>
      )}

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
              <tr
                key={area.id}
                className={area.pincode === selectedPincode ? 'border-t bg-amber-50' : 'border-t'}
              >
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
