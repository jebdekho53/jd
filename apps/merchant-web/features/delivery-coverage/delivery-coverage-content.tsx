'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Upload } from 'lucide-react';
import { GoogleStoreMap, useGoogleMaps, type AddressLocationValue } from '@jebdekho/google-maps';
import { useStoreStore } from '@/store/store-store';
import { MerchantAddressPicker } from '@/components/google-maps/merchant-address-picker';
import { ApiError, merchantFetch } from '@/services/api/merchant-client';
import { useStoreQuery, useUpdateStoreMutation } from '@/hooks/use-stores';
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
  const storeLat = storeDetail?.latitude ?? 0;
  const storeLng = storeDetail?.longitude ?? 0;
  const { isConfigured, isLoaded } = useGoogleMaps();

  const savedRadiusKm = storeDetail?.deliveryRadiusKm ?? 5;
  const [radiusKm, setRadiusKm] = useState(savedRadiusKm);
  // Keep the local slider in sync when the store (or its saved radius) changes.
  useEffect(() => {
    setRadiusKm(savedRadiusKm);
  }, [savedRadiusKm, storeId]);
  const radiusDirty = Math.abs(radiusKm - savedRadiusKm) > 0.05;

  const updateStoreMutation = useUpdateStoreMutation(storeId ?? '');
  const saveRadius = () => {
    if (!storeId) return;
    const clamped = Math.min(50, Math.max(0.5, Math.round(radiusKm * 10) / 10));
    updateStoreMutation.mutate(
      { deliveryRadiusKm: clamped },
      {
        onSuccess: () => setCoverageMessage({ type: 'success', text: `Delivery radius saved: ${clamped} km.` }),
        onError: (err) =>
          setCoverageMessage({
            type: 'error',
            text: err instanceof Error ? err.message : 'Could not save delivery radius.',
          }),
      },
    );
  };

  // ── Delivery method + free-delivery threshold ──────────────────────────────
  const savedDeliveryMode = storeDetail?.deliveryMode ?? 'PLATFORM';
  const savedFreeThreshold = storeDetail?.freeDeliveryThreshold ?? null;
  const [deliveryMode, setDeliveryMode] = useState<'PLATFORM' | 'SELF'>(savedDeliveryMode);
  const [freeThreshold, setFreeThreshold] = useState<string>(
    savedFreeThreshold != null ? String(savedFreeThreshold) : '',
  );
  useEffect(() => {
    setDeliveryMode(savedDeliveryMode);
    setFreeThreshold(savedFreeThreshold != null ? String(savedFreeThreshold) : '');
  }, [savedDeliveryMode, savedFreeThreshold, storeId]);

  const parsedThreshold = freeThreshold.trim() === '' ? null : Math.max(0, Number(freeThreshold) || 0);
  const deliveryModeDirty =
    deliveryMode !== savedDeliveryMode || parsedThreshold !== savedFreeThreshold;

  const saveDeliveryMethod = () => {
    if (!storeId) return;
    updateStoreMutation.mutate(
      {
        deliveryMode,
        // Self-delivery is always free to the customer, so the threshold is moot.
        freeDeliveryThreshold: deliveryMode === 'SELF' ? null : parsedThreshold,
      },
      {
        onSuccess: () =>
          setCoverageMessage({ type: 'success', text: 'Delivery method saved.' }),
        onError: (err) =>
          setCoverageMessage({
            type: 'error',
            text: err instanceof Error ? err.message : 'Could not save delivery method.',
          }),
      },
    );
  };

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

  const coordinatesMissing = storeDetail && (storeDetail.latitude == null || storeDetail.longitude == null);
  if (coordinatesMissing) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800">Store location missing</p>
        <p className="mt-2 text-sm text-red-700">
          Please update store location before configuring delivery coverage.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-xl border bg-white p-4">
        <h3 className="mb-1 font-medium">Delivery method</h3>
        <p className="mb-3 text-xs text-slate-500">
          Choose how orders from this store are delivered.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDeliveryMode('PLATFORM')}
            className={`rounded-lg border p-3 text-left ${deliveryMode === 'PLATFORM' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
          >
            <p className="font-medium">Platform delivery</p>
            <p className="text-xs text-slate-500">JebDekho arranges a rider. Customer pays the delivery fee (₹49) unless your free-delivery offer applies.</p>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMode('SELF')}
            className={`rounded-lg border p-3 text-left ${deliveryMode === 'SELF' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
          >
            <p className="font-medium">Self delivery (my own rider)</p>
            <p className="text-xs text-slate-500">You deliver with your own delivery boy. Delivery is free for the customer; JebDekho arranges nothing.</p>
          </button>
        </div>

        {deliveryMode === 'PLATFORM' && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
            <label className="text-sm text-slate-600">
              Free delivery on orders above (₹):
            </label>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="e.g. 499 (blank = off)"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(e.target.value)}
              className="w-40 rounded-lg border px-3 py-1.5 text-sm"
              aria-label="Free delivery threshold in rupees"
            />
            <span className="text-xs text-slate-500">
              Above this, you absorb the ₹49 fee (customer gets free delivery).
            </span>
          </div>
        )}

        <div className="mt-3">
          <Button
            type="button"
            disabled={!deliveryModeDirty || updateStoreMutation.isPending}
            onClick={saveDeliveryMethod}
          >
            {updateStoreMutation.isPending ? 'Saving…' : 'Save delivery method'}
          </Button>
        </div>
      </div>

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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">Coverage map</h3>
            <span className="text-sm text-slate-500">Delivery radius: <span className="font-semibold text-slate-700">{radiusKm.toFixed(1)} km</span></span>
          </div>
          {isConfigured && isLoaded ? (
            <>
              <GoogleStoreMap
                buyerLat={storeLat}
                buyerLng={storeLng}
                stores={[{ id: storeDetail.id, name: storeDetail.name, lat: storeLat, lng: storeLng }]}
                radiusKm={radiusKm}
                editableRadius
                onRadiusChange={setRadiusKm}
              />
              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={50}
                    step={0.5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                    aria-label="Delivery radius in kilometres"
                  />
                  <input
                    type="number"
                    min={0.5}
                    max={50}
                    step={0.5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Math.min(50, Math.max(0.5, Number(e.target.value) || 0.5)))}
                    className="w-20 rounded-lg border px-2 py-1.5 text-sm"
                    aria-label="Delivery radius value"
                  />
                  <span className="text-sm text-slate-500">km</span>
                </div>
                <Button
                  type="button"
                  disabled={!radiusDirty || updateStoreMutation.isPending}
                  onClick={saveRadius}
                >
                  {updateStoreMutation.isPending ? 'Saving…' : 'Save radius'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Drag the circle&apos;s edge on the map or use the slider to set how far you deliver from the store. Orders inside this circle are treated as deliverable.
              </p>
            </>
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

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[560px] text-sm">
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
