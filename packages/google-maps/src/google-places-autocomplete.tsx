'use client';

import { useCallback, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { MapPin, Search } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import type { ParsedGoogleAddress } from './parse-address';
import { parsePlaceResult } from './parse-address';
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleLoad = useCallback((instance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = instance;
  }, []);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;
    const parsed = parsePlaceResult(place);
    if (parsed) onPlaceSelect(parsed);
  }, [onPlaceSelect]);

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
        <Autocomplete
          onLoad={handleLoad}
          onPlaceChanged={handlePlaceChanged}
          options={{
            componentRestrictions: { country: 'in' },
            bounds: new google.maps.LatLngBounds(
              { lat: 28.32, lng: 76.84 },
              { lat: 28.9, lng: 77.75 },
            ),
            strictBounds: false,
            fields: ['address_components', 'geometry', 'formatted_address', 'name', 'place_id'],
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              defaultValue={value}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete="off"
              className={cn(
                'h-11 w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none transition',
                error
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
              )}
            />
          </div>
        </Autocomplete>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3" aria-hidden />
        Powered by Google
      </p>
    </div>
  );
}
