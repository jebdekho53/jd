'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import { MAP_INITIAL_VISUAL_CENTER, DEFAULT_MAP_ZOOM, GOOGLE_MAPS_MAP_ID } from './constants';
import { cn } from './cn';
import { AdvancedMarker } from './advanced-marker';

export interface MapPickerPosition {
  lat: number;
  lng: number;
}

export interface GoogleMapPickerProps {
  position: MapPickerPosition;
  onPositionChange: (position: MapPickerPosition) => void;
  className?: string;
  heightClassName?: string;
  disabled?: boolean;
  viewport?: google.maps.LatLngBoundsLiteral | null;
  address?: string;
  focusZoom?: number;
}

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: 'greedy',
  ...(GOOGLE_MAPS_MAP_ID ? { mapId: GOOGLE_MAPS_MAP_ID } : {}),
};

/**
 * Reusable address map picker. Users can search in the paired Places input,
 * click the map, or drag the marker to set the exact pin.
 */
export function GoogleMapPicker({
  position,
  onPositionChange,
  className,
  heightClassName = 'h-64 sm:h-80',
  disabled,
  viewport,
  address,
  focusZoom = 17,
}: GoogleMapPickerProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  const center = useMemo(
    () =>
      position.lat && position.lng
        ? { lat: position.lat, lng: position.lng }
        : MAP_INITIAL_VISUAL_CENTER,
    [position.lat, position.lng],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (viewport) {
      const bounds = new google.maps.LatLngBounds(
        { lat: viewport.south, lng: viewport.west },
        { lat: viewport.north, lng: viewport.east },
      );
      map.fitBounds(bounds);
      return;
    }

    map.panTo(center);
    map.setZoom(focusZoom);
  }, [center, focusZoom, viewport]);

  if (loadError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 p-4 text-center text-sm text-red-700',
          heightClassName,
          className,
        )}
      >
        Could not load map. Check your connection or try again.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600',
          heightClassName,
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading map…
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm',
          heightClassName,
        )}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={DEFAULT_MAP_ZOOM}
          options={{ ...mapOptions, draggable: !disabled }}
          onLoad={(map) => {
            mapRef.current = map;
            setMap(map);
          }}
          onUnmount={() => {
            setMap(null);
            mapRef.current = null;
          }}
          onClick={(event) => {
            if (disabled || !event.latLng) return;
            onPositionChangeRef.current({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            });
          }}
        >
          <AdvancedMarker
            map={map}
            position={center}
            draggable={!disabled}
            title={address || 'Selected location'}
            color="#16a34a"
            onDragEnd={(nextPosition) => onPositionChangeRef.current(nextPosition)}
          />
        </GoogleMap>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center">
          <div className="max-w-full rounded-lg bg-slate-900/90 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-lg">
            Click the map or drag the pin to set the exact spot
          </div>
        </div>
      </div>
    </div>
  );
}
