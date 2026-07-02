'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, GOOGLE_MAPS_MAP_ID } from './constants';
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
}

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions: google.maps.MapOptions = {
  // Advanced Markers require a Map ID; without it the console warns on every
  // marker render ("map initialized without a valid Map ID").
  mapId: GOOGLE_MAPS_MAP_ID,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
};

export function GoogleMapPicker({
  position,
  onPositionChange,
  className,
  heightClassName = 'h-48 sm:h-56',
  disabled,
}: GoogleMapPickerProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(
    () =>
      position.lat && position.lng
        ? { lat: position.lat, lng: position.lng }
        : DEFAULT_MAP_CENTER,
    [position.lat, position.lng],
  );

  useEffect(() => {
    mapRef.current?.panTo(center);
  }, [center]);

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (disabled || !event.latLng) return;
      onPositionChange({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    },
    [disabled, onPositionChange],
  );

  const handleMarkerDragEnd = useCallback(
    (next: google.maps.LatLngLiteral) => {
      if (disabled) return;
      onPositionChange(next);
    },
    [disabled, onPositionChange],
  );

  if (loadError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 p-4 text-sm text-red-700',
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
          'relative overflow-hidden rounded-xl border border-slate-200 shadow-sm',
          heightClassName,
        )}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={DEFAULT_MAP_ZOOM}
          options={mapOptions}
          onClick={handleMapClick}
          onLoad={(map) => {
            mapRef.current = map;
            setMap(map);
          }}
          onUnmount={() => {
            mapRef.current = null;
            setMap(null);
          }}
        >
          <AdvancedMarker
            map={map}
            position={center}
            draggable={!disabled}
            onDragEnd={handleMarkerDragEnd}
            color="#2563eb"
          />
        </GoogleMap>
      </div>
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3" aria-hidden />
        Tap the map or drag the pin to adjust your location
      </p>
    </div>
  );
}
