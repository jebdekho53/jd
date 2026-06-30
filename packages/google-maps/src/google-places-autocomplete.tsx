'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import type { ParsedGoogleAddress } from './parse-address';
import { parseAddressComponents } from './parse-address';
import { cn } from './cn';

export interface GooglePlacesAutocompleteProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onPlaceSelect: (address: ParsedGoogleAddress) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

type PlaceWidget = HTMLElement & {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  includedRegionCodes?: string[];
  locationBias?: google.maps.LatLngBoundsLiteral;
};

type PlaceSelectEvent = Event & {
  detail?: {
    place?: GooglePlaceLike;
    placePrediction?: {
      toPlace: () => GooglePlaceLike;
    };
  };
};

type GooglePlaceLike = {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: google.maps.LatLng;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  fetchFields?: (input: { fields: string[] }) => Promise<void>;
};

function toAddressComponents(
  components: GooglePlaceLike['addressComponents'],
): google.maps.GeocoderAddressComponent[] {
  return (components ?? []).map((component) => ({
    long_name: component.longText ?? component.shortText ?? '',
    short_name: component.shortText ?? component.longText ?? '',
    types: component.types ?? [],
  }));
}

function parseSelectedPlace(place: GooglePlaceLike): ParsedGoogleAddress | null {
  const location = place.location;
  if (!location || !place.addressComponents?.length) return null;
  const parsed = parseAddressComponents(
    toAddressComponents(place.addressComponents),
    location.lat(),
    location.lng(),
    place.formattedAddress ?? place.displayName,
  );
  return {
    ...parsed,
    googlePlaceId: place.id,
  };
}

export function GooglePlacesAutocomplete({
  label = 'Search address',
  placeholder = 'Search street, area, or landmark',
  value = '',
  onPlaceSelect,
  error,
  disabled,
  className,
}: GooglePlacesAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = useCallback(
    async (event: PlaceSelectEvent) => {
      const place =
        event.detail?.place ??
        event.detail?.placePrediction?.toPlace();
      if (!place) return;

      await place.fetchFields?.({
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'],
      });
      const parsed = parseSelectedPlace(place);
      if (parsed) onPlaceSelect(parsed);
    },
    [onPlaceSelect],
  );

  useEffect(() => {
    if (!isLoaded || !hostRef.current) return undefined;
    const places = google.maps.places as unknown as {
      PlaceAutocompleteElement?: new () => HTMLElement;
    };
    const AutocompleteElement = places.PlaceAutocompleteElement;
    if (!AutocompleteElement) return undefined;

    const element = new AutocompleteElement() as PlaceWidget;
    element.placeholder = placeholder;
    element.value = value;
    element.disabled = Boolean(disabled);
    element.includedRegionCodes = ['in'];
    element.locationBias = {
      north: 28.9,
      south: 28.32,
      east: 77.75,
      west: 76.84,
    };
    element.className = 'block w-full';
    element.addEventListener('gmp-select', handleSelect as EventListener);

    hostRef.current.replaceChildren(element);
    return () => {
      element.removeEventListener('gmp-select', handleSelect as EventListener);
      element.remove();
    };
  }, [disabled, handleSelect, isLoaded, placeholder, value]);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      {!isLoaded ? (
        <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          Loading maps…
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <div
            ref={hostRef}
            className={cn(
              'min-h-11 w-full rounded-lg border bg-white py-1 pl-8 pr-2 text-sm outline-none transition',
              error
                ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-200'
                : 'border-slate-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
            )}
          >
            <input
              ref={fallbackRef}
              type="text"
              defaultValue={value}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete="off"
              className="h-9 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3" aria-hidden />
        Powered by Google
      </p>
    </div>
  );
}
