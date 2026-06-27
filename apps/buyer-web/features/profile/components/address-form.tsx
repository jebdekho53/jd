'use client';

import { useState } from 'react';
import type { AddressLabel, ProfileAddress, UpsertAddressInput } from '@/features/profile/types';
import { BuyerAddressPicker, type AddressLocationValue } from '@/components/google-maps/buyer-address-picker';
import { cn } from '@/lib/utils';

const LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

interface AddressFormProps {
  initial?: ProfileAddress;
  onSubmit: (data: UpsertAddressInput) => void;
  onCancel: () => void;
  isPending?: boolean;
  className?: string;
}

export function AddressForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  className,
}: AddressFormProps) {
  const [label, setLabel] = useState<AddressLabel>(initial?.label ?? 'Home');
  const [line1, setLine1] = useState(initial?.line1 ?? '');
  const [line2, setLine2] = useState(initial?.line2 ?? '');
  const [landmark, setLandmark] = useState(initial?.landmark ?? '');
  const [pincode, setPincode] = useState(initial?.pincode ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [lat, setLat] = useState(initial?.lat ?? 28.6139);
  const [lng, setLng] = useState(initial?.lng ?? 77.209);
  const [locality, setLocality] = useState(initial?.city ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocationChange = (selection: AddressLocationValue) => {
    setLocality(selection.locality);
    setCity(selection.city);
    setPincode(selection.pincode);
    setLat(selection.lat);
    setLng(selection.lng);
    setLocationError(null);
    if (selection.line1 && !line1) setLine1(selection.line1);
    if (selection.line2 && !line2) setLine2(selection.line2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setLocationError('Select a valid address with 6-digit pincode');
      return;
    }
    onSubmit({
      label,
      line1,
      line2: line2 || undefined,
      landmark: landmark || undefined,
      pincode,
      city: city || undefined,
      lat,
      lng,
      isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-jd-text-muted">
          Address type
        </legend>
        <div className="flex gap-2">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLabel(l)}
              className={cn(
                'flex-1 rounded-xl border py-2 text-sm font-medium transition',
                label === l
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-jd-text-secondary hover:bg-cream-3',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>

      <BuyerAddressPicker
        value={{ locality, city, state: '', pincode, lat, lng }}
        onChange={handleLocationChange}
        onLine1Suggestion={setLine1}
        error={locationError ?? undefined}
        searchLabel="Search address"
      />

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-jd-text-muted">Address line 1</span>
          <input
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="House no., building, street"
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-jd-text-muted">Address line 2 (optional)</span>
          <input
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Area, colony"
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-jd-text-muted">Landmark (optional)</span>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Near metro, mall, etc."
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-jd-text-muted">Pincode</span>
            <input
              required
              readOnly
              pattern="[0-9]{6}"
              maxLength={6}
              value={pincode}
              className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-jd-text-muted">City</span>
            <input
              readOnly
              value={city}
              className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm outline-none"
            />
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          <span className="text-sm text-jd-text-secondary">Set as default address</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-semibold text-jd-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? 'Saving…' : initial ? 'Update address' : 'Save address'}
        </button>
      </div>
    </form>
  );
}
