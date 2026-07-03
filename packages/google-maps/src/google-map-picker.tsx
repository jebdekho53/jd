'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, GOOGLE_MAPS_MAP_ID } from './constants';
import { cn } from './cn';

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
  // Advanced Markers / vector map require a Map ID.
  mapId: GOOGLE_MAPS_MAP_ID,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: 'greedy',
};

/**
 * Blinkit/Zepto-style location picker: the pin is fixed to the centre of the
 * map and the user moves the map underneath it. Whenever the map settles, the
 * new centre is emitted so the parent can reverse-geocode it.
 */
export function GoogleMapPicker({
  position,
  onPositionChange,
  className,
  heightClassName = 'h-64 sm:h-80',
  disabled,
}: GoogleMapPickerProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [, setReady] = useState(false);

  // True while the user is actively panning — so a programmatic panTo doesn't
  // get echoed back as a user move (which would fight the parent's position).
  const userMovingRef = useRef(false);
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  const center = useMemo(
    () =>
      position.lat && position.lng
        ? { lat: position.lat, lng: position.lng }
        : DEFAULT_MAP_CENTER,
    [position.lat, position.lng],
  );

  // Recentre the map when the position changes from outside (search, GPS).
  useEffect(() => {
    if (userMovingRef.current) return;
    mapRef.current?.panTo(center);
  }, [center]);

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
            setReady(true);
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
          onDragStart={() => {
            if (!disabled) userMovingRef.current = true;
          }}
          onIdle={() => {
            if (!userMovingRef.current) return;
            userMovingRef.current = false;
            const c = mapRef.current?.getCenter();
            if (c) onPositionChangeRef.current({ lat: c.lat(), lng: c.lng() });
          }}
        />

        {/* Fixed centre pin — the map moves under it (pointer-events-none so it
            never blocks dragging). Its tip sits exactly at the map centre. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <div className="mb-1 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-lg">
            Order will be delivered here
            <div className="text-[10px] font-normal text-slate-300">Move the map to set the exact spot</div>
          </div>
          <MapPin className="h-9 w-9 fill-rose-600 text-white drop-shadow-md" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
