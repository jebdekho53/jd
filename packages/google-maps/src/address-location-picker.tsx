'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Navigation } from 'lucide-react';
import { GooglePlacesAutocomplete } from './google-places-autocomplete';
import { GoogleMapPicker } from './google-map-picker';
import { OsmMapPicker } from './osm-map-picker';
import { useGoogleMaps } from './google-maps-context';
import type { ParsedGoogleAddress } from './parse-address';
import { normalizeIndianPincode } from './parse-address';
import { DEFAULT_MAP_CENTER } from './constants';

export interface AddressLocationValue {
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  line1?: string;
  line2?: string;
  formattedAddress?: string;
  googlePlaceId?: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
}

export interface AddressLocationPickerProps {
  value: Partial<AddressLocationValue>;
  onChange: (value: AddressLocationValue) => void;
  onLine1Suggestion?: (line1: string) => void;
  error?: string;
  showMap?: boolean;
  mapHeightClassName?: string;
  searchLabel?: string;
  fallback?: ReactNode;
  onRequestLocation?: () => Promise<{ lat: number; lng: number }>;
  onReverseGeocode?: (lat: number, lng: number) => Promise<ParsedGoogleAddress | null>;
  buttonClassName?: string;
  outlineButtonClassName?: string;
  showSelectionSummary?: boolean;
}

function fromParsed(address: ParsedGoogleAddress): AddressLocationValue {
  return {
    locality: address.locality || address.line1 || address.formattedAddress || 'Pinned location',
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    lat: address.lat,
    lng: address.lng,
    line1: address.line1,
    line2: address.line2,
    formattedAddress: address.formattedAddress,
    googlePlaceId: address.googlePlaceId,
  };
}

function mergeGeocodeResults(
  primary: ParsedGoogleAddress,
  secondary: ParsedGoogleAddress,
): ParsedGoogleAddress {
  const pincode =
    normalizeIndianPincode(primary.pincode, primary.formattedAddress) ||
    normalizeIndianPincode(secondary.pincode, secondary.formattedAddress);
  return {
    ...primary,
    pincode,
    city: primary.city || secondary.city,
    state: primary.state || secondary.state,
    locality: primary.locality || secondary.locality,
    line1: primary.line1 || secondary.line1,
    formattedAddress: primary.formattedAddress || secondary.formattedAddress,
  };
}

function hasValidPincode(address: ParsedGoogleAddress): boolean {
  return /^\d{6}$/.test(normalizeIndianPincode(address.pincode, address.formattedAddress));
}

export function AddressLocationPicker({
  value,
  onChange,
  onLine1Suggestion,
  error,
  showMap = true,
  mapHeightClassName = 'h-52 sm:h-64',
  searchLabel = 'Search address',
  fallback = null,
  onRequestLocation,
  onReverseGeocode,
  buttonClassName = 'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white text-sm font-medium',
  outlineButtonClassName,
  showSelectionSummary = true,
}: AddressLocationPickerProps) {
  const { isConfigured } = useGoogleMaps();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const position = {
    lat: value.lat ?? DEFAULT_MAP_CENTER.lat,
    lng: value.lng ?? DEFAULT_MAP_CENTER.lng,
  };

  const applyParsed = useCallback(
    (parsed: ParsedGoogleAddress) => {
      onChange(fromParsed(parsed));
      if (parsed.line1 && onLine1Suggestion) onLine1Suggestion(parsed.line1);
    },
    [onChange, onLine1Suggestion],
  );

  const reverse = useCallback(
    async (lat: number, lng: number) => {
      setGeocoding(true);
      setGeocodeError(null);
      try {
        let clientResult: ParsedGoogleAddress | null = null;
        if (isConfigured) {
          const { reverseGeocodeClient } = await import('./reverse-geocode-client');
          clientResult = await reverseGeocodeClient(lat, lng);
          if (clientResult && hasValidPincode(clientResult)) {
            return {
              ...clientResult,
              pincode: normalizeIndianPincode(
                clientResult.pincode,
                clientResult.formattedAddress,
              ),
            };
          }
        }
        if (onReverseGeocode) {
          const serverResult = await onReverseGeocode(lat, lng);
          if (serverResult && clientResult) {
            const merged = mergeGeocodeResults(clientResult, serverResult);
            if (hasValidPincode(merged)) return merged;
          }
          if (serverResult && hasValidPincode(serverResult)) {
            return {
              ...serverResult,
              pincode: normalizeIndianPincode(
                serverResult.pincode,
                serverResult.formattedAddress,
              ),
            };
          }
          if (serverResult) return serverResult;
        }
        if (clientResult) return clientResult;
        return null;
      } catch (err) {
        setGeocodeError(err instanceof Error ? err.message : 'Reverse geocoding failed');
        return null;
      } finally {
        setGeocoding(false);
      }
    },
    [isConfigured, onReverseGeocode],
  );

  const handleMapMove = useCallback(
    async (coords: { lat: number; lng: number }) => {
      const parsed = await reverse(coords.lat, coords.lng);
      if (parsed) {
        applyParsed(parsed);
        if (!hasValidPincode(parsed)) {
          setGeocodeError('Could not detect pincode for this pin. Search your area on the map or enter pincode below.');
        }
        return;
      }
      onChange({
        locality: value.locality || 'Pinned location',
        city: value.city ?? '',
        state: value.state ?? '',
        pincode: '',
        lat: coords.lat,
        lng: coords.lng,
      });
      setGeocodeError('Could not resolve address for this location. Try search or enter pincode manually.');
    },
    [applyParsed, onChange, reverse, value],
  );

  const handleCurrentLocation = async () => {
    if (!onRequestLocation) return;
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await onRequestLocation();
      onChange({
        locality: value.locality || 'Current location',
        city: value.city ?? '',
        state: value.state ?? '',
        pincode: value.pincode ?? '',
        lat: pos.lat,
        lng: pos.lng,
      });
      const parsed = await reverse(pos.lat, pos.lng);
      if (parsed) {
        applyParsed(parsed);
        if (!hasValidPincode(parsed)) {
          setGeocodeError('Could not detect pincode for this location. Enter pincode manually below.');
        }
        return;
      }
      setGeocodeError('Could not resolve address. You can still enter pincode and address manually.');
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setGpsLoading(false);
    }
  };

  const combinedError = error ?? gpsError ?? undefined;

  const locationButton = onRequestLocation ? (
    <button
      type="button"
      className={outlineButtonClassName ?? buttonClassName}
      disabled={gpsLoading || geocoding}
      onClick={handleCurrentLocation}
    >
      <Navigation className="h-4 w-4" aria-hidden />
      {gpsLoading || geocoding ? 'Locating…' : 'Use current location'}
    </button>
  ) : null;

  const mapPicker = showMap ? (
    isConfigured ? (
      <GoogleMapPicker
        position={position}
        onPositionChange={handleMapMove}
        disabled={geocoding}
        heightClassName={mapHeightClassName}
      />
    ) : onReverseGeocode ? (
      <OsmMapPicker
        position={position}
        onPositionChange={handleMapMove}
        disabled={geocoding}
        heightClassName={mapHeightClassName}
      />
    ) : null
  ) : null;

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        {fallback}
        {locationButton}
        {mapPicker}
        {combinedError ? <p className="text-sm text-red-600">{combinedError}</p> : null}
        {geocodeError ? <p className="text-sm text-amber-700">{geocodeError}</p> : null}
        {showSelectionSummary && value.locality && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p>
              {value.locality}
              {value.city ? ` · ${value.city}` : ''}
              {value.state ? ` · ${value.state}` : ''}
              {value.pincode ? ` · PIN ${value.pincode}` : ' · Pincode pending'}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GooglePlacesAutocomplete
        label={searchLabel}
        value={value.locality}
        onPlaceSelect={applyParsed}
        error={combinedError}
      />

      {locationButton}

      {mapPicker}
      {geocodeError ? <p className="text-sm text-amber-700">{geocodeError}</p> : null}

      {fallback}

      {showSelectionSummary && value.locality && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <p>
            {value.locality}
            {value.city ? ` · ${value.city}` : ''}
            {value.state ? ` · ${value.state}` : ''}
            {value.pincode ? ` · PIN ${value.pincode}` : ' · Pincode pending'}
          </p>
        </div>
      )}
    </div>
  );
}
