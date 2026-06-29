'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Navigation } from 'lucide-react';
import { GooglePlacesAutocomplete } from './google-places-autocomplete';
import { GoogleMapPicker } from './google-map-picker';
import { OsmMapPicker } from './osm-map-picker';
import { useGoogleMaps } from './google-maps-context';
import type { ParsedGoogleAddress } from './parse-address';
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
}

function fromParsed(address: ParsedGoogleAddress): AddressLocationValue {
  return {
    locality: address.locality,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    lat: address.lat,
    lng: address.lng,
    line1: address.line1,
    line2: address.line2,
  };
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
        if (isConfigured) {
          const { reverseGeocodeClient } = await import('./reverse-geocode-client');
          const clientResult = await reverseGeocodeClient(lat, lng);
          if (clientResult) return clientResult;
        }
        if (onReverseGeocode) {
          return await onReverseGeocode(lat, lng);
        }
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
      if (parsed) applyParsed(parsed);
      else
        onChange({
          locality: value.locality ?? '',
          city: value.city ?? '',
          state: value.state ?? '',
          pincode: value.pincode ?? '',
          lat: coords.lat,
          lng: coords.lng,
        });
    },
    [applyParsed, onChange, reverse, value],
  );

  const handleCurrentLocation = async () => {
    if (!onRequestLocation) return;
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await onRequestLocation();
      const parsed = await reverse(pos.lat, pos.lng);
      if (parsed) {
        applyParsed(parsed);
        return;
      }
      onChange({
        locality: value.locality ?? 'Current location',
        city: value.city ?? '',
        state: value.state ?? '',
        pincode: value.pincode ?? '',
        lat: pos.lat,
        lng: pos.lng,
      });
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setGpsLoading(false);
    }
  };

  const combinedError = error ?? geocodeError ?? gpsError ?? undefined;

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
        {value.locality && value.pincode && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p>
              {value.locality}
              {value.city ? ` · ${value.city}` : ''}
              {value.state ? ` · ${value.state}` : ''}
              {value.pincode ? ` · PIN ${value.pincode}` : ''}
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

      {fallback}

      {value.locality && value.pincode && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <p>
            {value.locality}
            {value.city ? ` · ${value.city}` : ''}
            {value.state ? ` · ${value.state}` : ''}
            {value.pincode ? ` · PIN ${value.pincode}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
