'use client';

import { useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import type { AddressLabel, ProfileAddress, UpsertAddressInput } from '@/features/profile/types';
import { BuyerAddressPicker, type AddressLocationValue } from '@/components/google-maps/buyer-address-picker';
import { cn } from '@/lib/utils';

const LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

interface AddressFormProps {
  initial?: ProfileAddress;
  onSubmit: (data: UpsertAddressInput) => void;
  onCancel: () => void;
  isPending?: boolean;
}

/**
 * Full-screen, Blinkit/Zepto-style address picker: the map fills the viewport
 * with the search overlaid on top, and a bottom sheet shows the resolved
 * address plus the "Confirm Location" action. Submit logic is unchanged.
 */
export function AddressForm({ initial, onSubmit, onCancel, isPending }: AddressFormProps) {
  const [label, setLabel] = useState<AddressLabel>(initial?.label ?? 'Home');
  const [line1, setLine1] = useState(initial?.line1 ?? '');
  const [line2, setLine2] = useState(initial?.line2 ?? '');
  const [landmark, setLandmark] = useState(initial?.landmark ?? '');
  const [pincode, setPincode] = useState(initial?.pincode ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
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
      setLocationError('Move the map to a spot with a valid 6-digit pincode.');
      return;
    }
    if (!line1.trim()) {
      setLocationError('Add your house / flat / building number.');
      return;
    }
    if (lat == null || lng == null || (Math.abs(lat - 28.6139) < 0.0001 && Math.abs(lng - 77.209) < 0.0001)) {
      setLocationError('Please select your delivery location on the map.');
      return;
    }
    onSubmit({
      label,
      line1,
      line2: line2 || undefined,
      landmark: landmark || undefined,
      pincode,
      city: city || undefined,
      lat: lat!,
      lng: lng!,
      isDefault,
    });
  };

  const inputClass =
    'w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  const summarySub = [city, pincode ? `PIN ${pincode}` : null].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-card px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-jd-text-primary"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="text-base font-bold text-jd-text-primary">
          {initial ? 'Edit address' : 'Add address'}
        </h1>
      </header>

      {/* Map fills the remaining space; search is overlaid on the map */}
      <div className="relative min-h-0 flex-1">
        <BuyerAddressPicker
          layout="fullscreen"
          value={{ locality, city, state: '', pincode, lat: lat ?? undefined, lng: lng ?? undefined }}
          onChange={handleLocationChange}
          onLine1Suggestion={setLine1}
          error={locationError ?? undefined}
          searchLabel="Search for apartment, street name…"
        />
      </div>

      {/* Bottom sheet */}
      <form
        onSubmit={handleSubmit}
        className="max-h-[58vh] shrink-0 overflow-y-auto rounded-t-3xl border-t border-border/60 bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />

        {/* Resolved location */}
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-cream-3 p-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-semibold text-jd-text-primary">
              {locality || 'Move the map to set your location'}
            </p>
            <p className="truncate text-xs text-jd-text-muted">{summarySub || 'Pincode pending'}</p>
          </div>
        </div>

        {/* Save as */}
        <fieldset className="mb-4">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-jd-text-muted">
            Save as
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

        {/* Address details */}
        <div className="space-y-3">
          <input
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="House / flat / building no. *"
            className={inputClass}
          />
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Landmark (optional)"
            className={inputClass}
          />
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

        {locationError ? <p className="mt-2 text-xs text-red-600">{locationError}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Confirm Location'}
        </button>
      </form>
    </div>
  );
}
