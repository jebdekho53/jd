'use client';

import {
  AddressLocationPicker,
  type AddressLocationValue,
  type ParsedGoogleAddress,
} from '@jebdekho/google-maps';
import {
  LocationSearchInput,
  type LocationSelection,
} from '@/features/locations/components/location-search-input';

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
  onMasterSelect?: (selection: LocationSelection) => void;
  masterValue?: string;
  masterPincode?: string;
  directorySearchLabel?: string;
  showDirectoryFallback?: boolean;
}

export function MerchantAddressPicker({
  value,
  onChange,
  onLine1Suggestion,
  error,
  searchLabel,
  mapHeightClassName = 'h-56 sm:h-72',
  onMasterSelect,
  masterValue,
  masterPincode,
  directorySearchLabel = "Can't find on map? Search directory",
  showDirectoryFallback = true,
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
      onReverseGeocode={reverseGeocodeCached}
      onRequestLocation={async () => {
        const { requestBrowserLocation } = await import('@/lib/geolocation');
        return requestBrowserLocation();
      }}
      fallback={
        showDirectoryFallback ? (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500">{directorySearchLabel}</p>
            <LocationSearchInput
              label="Directory search"
              value={masterValue}
              pincode={masterPincode}
              onSelect={(s) => {
                onMasterSelect?.(s);
                onChange({
                  locality: s.label,
                  city: s.city,
                  state: s.state,
                  pincode: s.pincode,
                  lat: s.latitude,
                  lng: s.longitude,
                  locationPincodeId: s.locationPincodeId,
                  locationAreaId: s.locationAreaId,
                  locationCityId: s.locationCityId,
                });
              }}
              error={error}
            />
          </div>
        ) : null
      }
    />
  );
}
