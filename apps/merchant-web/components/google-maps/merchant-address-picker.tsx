'use client';

import {
  AddressLocationPicker,
  type AddressLocationValue,
  type ParsedGoogleAddress,
} from '@jebdekho/google-maps';

async function reverseGeocodeCached(lat: number, lng: number): Promise<ParsedGoogleAddress | null> {
  const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`, { credentials: 'include' });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ParsedGoogleAddress | null };
  return json.data ?? null;
}

interface MerchantAddressPickerProps {
  value: Partial<AddressLocationValue>;
  onChange: (value: AddressLocationValue) => void;
  onLine1Suggestion?: (line1: string) => void;
  error?: string;
  searchLabel?: string;
  mapHeightClassName?: string;
  showSelectionSummary?: boolean;
}

export function MerchantAddressPicker({
  value,
  onChange,
  onLine1Suggestion,
  error,
  searchLabel,
  mapHeightClassName = 'h-56 sm:h-72',
  showSelectionSummary = true,
}: MerchantAddressPickerProps) {
  return (
    <AddressLocationPicker
      value={value}
      onChange={onChange}
      onLine1Suggestion={onLine1Suggestion}
      error={error}
      searchLabel={searchLabel}
      mapHeightClassName={mapHeightClassName}
      outlineButtonClassName="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:opacity-60"
      showSelectionSummary={showSelectionSummary}
      onReverseGeocode={reverseGeocodeCached}
      onRequestLocation={async () => {
        const { requestBrowserLocation } = await import('@/lib/geolocation');
        return requestBrowserLocation();
      }}
    />
  );
}
