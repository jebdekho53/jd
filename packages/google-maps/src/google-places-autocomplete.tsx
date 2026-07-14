'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

type PlacePrediction = { toPlace: () => GooglePlaceLike };

/**
 * `gmp-select` from <gmp-place-autocomplete> exposes the selection directly on the
 * event (`event.placePrediction`), NOT under `event.detail` — verified against Maps
 * JS in production. Older/other builds used `detail`, so both shapes are read.
 */
type PlaceSelectEvent = Event & {
  place?: GooglePlaceLike;
  placePrediction?: PlacePrediction;
  detail?: {
    place?: GooglePlaceLike;
    placePrediction?: PlacePrediction;
  };
};

type GooglePlaceLike = {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: google.maps.LatLng;
  viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  fetchFields?: (input: { fields: string[] }) => Promise<void>;
};

function toBoundsLiteral(
  viewport: GooglePlaceLike['viewport'],
): google.maps.LatLngBoundsLiteral | undefined {
  if (!viewport) return undefined;
  if ('getNorthEast' in viewport && 'getSouthWest' in viewport) {
    const northEast = viewport.getNorthEast();
    const southWest = viewport.getSouthWest();
    return {
      north: northEast.lat(),
      east: northEast.lng(),
      south: southWest.lat(),
      west: southWest.lng(),
    };
  }
  return viewport;
}

function toAddressComponents(
  components: GooglePlaceLike['addressComponents'],
): google.maps.GeocoderAddressComponent[] {
  return (components ?? []).map((component) => ({
    long_name: component.longText ?? component.shortText ?? '',
    short_name: component.shortText ?? component.longText ?? '',
    types: component.types ?? [],
  }));
}

/**
 * A selected place only needs coordinates to be usable — address components are a
 * bonus. Bailing out when they are missing used to silently drop the selection, so
 * searching (e.g. "Muradnagar") left the pin on the previously-set location with no
 * error. Coordinates alone are enough to move the map; the caller reverse-geocodes.
 */
function parseSelectedPlace(place: GooglePlaceLike): ParsedGoogleAddress | null {
  const location = place.location;
  if (!location) return null;
  const parsed = parseAddressComponents(
    toAddressComponents(place.addressComponents),
    location.lat(),
    location.lng(),
    place.formattedAddress ?? place.displayName,
  );
  return {
    ...parsed,
    googlePlaceId: place.id,
    viewport: toBoundsLiteral(place.viewport),
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
  const elementRef = useRef<PlaceWidget | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);

  // Keep the latest callback in a ref so `handleSelect` stays referentially stable.
  // Otherwise an unmemoized `onPlaceSelect` from the parent would re-run the effect
  // below on every render, destroying and rebuilding the autocomplete widget mid-use.
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  const handleSelect = useCallback(async (event: PlaceSelectEvent) => {
    const prediction = event.placePrediction ?? event.detail?.placePrediction;
    const place = event.place ?? event.detail?.place ?? prediction?.toPlace();
    if (!place) return;

    try {
      await place.fetchFields?.({
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents'],
      });
    } catch {
      // Fields may already be resolved; fall through and use whatever we have.
    }
    const parsed = parseSelectedPlace(place);
    if (parsed) onPlaceSelectRef.current(parsed);
  }, []);

  useEffect(() => {
    if (!isLoaded || !hostRef.current) return undefined;
    const places = google.maps.places as unknown as {
      PlaceAutocompleteElement?: new () => HTMLElement;
    };
    const AutocompleteElement = places.PlaceAutocompleteElement;
    if (!AutocompleteElement) return undefined;

    const element = new AutocompleteElement() as PlaceWidget;
    element.includedRegionCodes = ['in'];
    element.locationBias = {
      north: 28.9,
      south: 28.32,
      east: 77.75,
      west: 76.84,
    };
    element.className = 'block w-full';
    // Maps JS renamed this event; listen for both so selection never silently no-ops.
    element.addEventListener('gmp-select', handleSelect as EventListener);
    element.addEventListener('gmp-placeselect', handleSelect as EventListener);

    hostRef.current.replaceChildren(element);
    elementRef.current = element;
    setWidgetReady(true);

    return () => {
      element.removeEventListener('gmp-select', handleSelect as EventListener);
      element.removeEventListener('gmp-placeselect', handleSelect as EventListener);
      element.remove();
      elementRef.current = null;
      setWidgetReady(false);
    };
  }, [handleSelect, isLoaded]);

  // Sync props onto the live widget instead of recreating it (which would clear the
  // user's typed query and close the suggestions dropdown).
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    element.placeholder = placeholder;
    element.disabled = Boolean(disabled);
    if (value) element.value = value;
  }, [placeholder, disabled, value]);

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
          {/* The Places widget is mounted imperatively into this host. It must stay
              empty in JSX — rendering a child here would fight replaceChildren(). */}
          <div
            ref={hostRef}
            className={cn(
              'min-h-11 w-full rounded-lg border bg-white py-1 pl-8 pr-2 text-sm outline-none transition',
              error
                ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-200'
                : 'border-slate-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
            )}
          />
          {!widgetReady && (
            <p className="mt-1 text-xs text-amber-700">
              Address search is unavailable. Drag the pin on the map to set your location.
            </p>
          )}
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
