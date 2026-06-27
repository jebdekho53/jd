'use client';

import {
  AddressLocationPicker,
  type AddressLocationValue,
  type ParsedGoogleAddress,
} from '@jebdekho/google-maps';
import {
  LocationSearchInput,
  type LocationSelection,
} from '@/features/location/components/location-search-input';

async function reverseGeocodeCached(lat: number, lng: number): Promise<ParsedGoogleAddress | null> {
  const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`, { credentials: 'include' });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ParsedGoogleAddress | null };
  return json.data ?? null;
}

interface BuyerAddressPickerProps {
  value: Partial<AddressLocationValue>;
  onChange: (value: AddressLocationValue) => void;
  onLine1Suggestion?: (line1: string) => void;
  error?: string;
  showMap?: boolean;
  searchLabel?: string;
  onMasterSelect?: (selection: LocationSelection) => void;
  masterValue?: string;
}

export function BuyerAddressPicker({
  value,
  onChange,
  onLine1Suggestion,
  error,
  showMap = true,
  searchLabel,
  onMasterSelect,
  masterValue,
}: BuyerAddressPickerProps) {
  return (
    <AddressLocationPicker
      value={value}
      onChange={onChange}
      onLine1Suggestion={onLine1Suggestion}
      error={error}
      showMap={showMap}
      searchLabel={searchLabel}
      onReverseGeocode={reverseGeocodeCached}
      onRequestLocation={async () => {
        const { requestBrowserLocation } = await import('@/lib/geolocation');
        return requestBrowserLocation();
      }}
      fallback={
        onMasterSelect ? (
          <LocationSearchInput
            value={masterValue}
            onSelect={(s) => {
              onMasterSelect(s);
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
        ) : (
          <LocationSearchInput
            value={masterValue}
            onSelect={(s) => {
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
        )
      }
    />
  );
}

export type { AddressLocationValue };
