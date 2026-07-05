'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, Circle } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { AdvancedMarker, useGoogleMaps } from '@jebdekho/google-maps';

export interface AdminMapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  title?: string;
}

export interface AdminMapCircle {
  id: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  strokeColor?: string;
  fillColor?: string;
}

interface AdminGoogleMapProps {
  markers?: AdminMapMarker[];
  circles?: AdminMapCircle[];
  className?: string;
  heightClassName?: string;
  defaultCenter?: { lat: number; lng: number };
}

const mapContainerStyle = { width: '100%', height: '100%' };
function computeCenter(points: Array<{ lat: number; lng: number }>) {
  if (points.length === 0) return { lat: 0, lng: 0 };
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

export function AdminGoogleMap({
  markers = [],
  circles = [],
  className,
  heightClassName = 'h-80 sm:h-96',
  defaultCenter,
}: AdminGoogleMapProps) {
  const { isLoaded, loadError, isConfigured } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  if (!defaultCenter && markers.length === 0 && circles.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed bg-slate-50 p-6 text-sm text-slate-500 ${heightClassName} ${className ?? ''}`}>
        No locations to display.
      </div>
    );
  }

  const center = useMemo(() => {
    if (defaultCenter) return defaultCenter;
    const pts = [
      ...markers.map((m) => ({ lat: m.lat, lng: m.lng })),
      ...circles.map((c) => ({ lat: c.lat, lng: c.lng })),
    ];
    return computeCenter(pts);
  }, [markers, circles, defaultCenter]);

  if (!isConfigured) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed bg-slate-50 p-6 text-sm text-slate-500 ${heightClassName} ${className ?? ''}`}>
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map overlays.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${heightClassName} ${className ?? ''}`}>
        Could not load map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center gap-2 rounded-xl border bg-slate-50 text-sm text-slate-600 ${heightClassName} ${className ?? ''}`}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading map…
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${heightClassName} ${className ?? ''}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={11}
        options={{ disableDefaultUI: true, zoomControl: true, fullscreenControl: true }}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
      >
        {circles.map((c) => (
          <Circle
            key={c.id}
            center={{ lat: c.lat, lng: c.lng }}
            radius={c.radiusMeters}
            options={{
              strokeColor: c.strokeColor ?? '#6366f1',
              strokeOpacity: 0.6,
              strokeWeight: 1,
              fillColor: c.fillColor ?? '#6366f1',
              fillOpacity: 0.12,
            }}
          />
        ))}
        {markers.map((m) => (
          <AdvancedMarker
            key={m.id}
            map={map}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.title ?? m.label}
            label={m.label}
            color={m.color}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
