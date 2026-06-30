'use client';

import { useMemo, useState } from 'react';
import { GoogleMap, Polyline } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import { DEFAULT_MAP_ZOOM } from './constants';
import { AdvancedMarker } from './advanced-marker';

export interface DeliveryMapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface GoogleDeliveryMapProps {
  store: DeliveryMapPoint;
  customer: DeliveryMapPoint;
  rider?: DeliveryMapPoint | null;
  route?: Array<{ lat: number; lng: number }>;
  className?: string;
  heightClassName?: string;
}

const mapContainerStyle = { width: '100%', height: '100%' };

export function GoogleDeliveryMap({
  store,
  customer,
  rider,
  route = [],
  className,
  heightClassName = 'h-56 sm:h-72',
}: GoogleDeliveryMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(() => {
    const pts = [store, customer, ...(rider ? [rider] : [])];
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    return { lat, lng };
  }, [store, customer, rider]);

  const path = useMemo(() => {
    if (route.length > 1) return route;
    if (rider?.lat != null && rider.lng != null) {
      return [store, rider, customer];
    }
    return [store, customer];
  }, [route, rider, store, customer]);

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
        zoom={DEFAULT_MAP_ZOOM}
        options={{ disableDefaultUI: true, zoomControl: true, fullscreenControl: true }}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
      >
        <AdvancedMarker map={map} position={store} label="S" color="#2563eb" />
        <AdvancedMarker map={map} position={customer} label="C" color="#16a34a" />
        {rider?.lat != null && rider.lng != null && (
          <AdvancedMarker map={map} position={{ lat: rider.lat, lng: rider.lng }} label="D" color="#f97316" />
        )}
        <Polyline path={path} options={{ strokeColor: '#6366f1', strokeWeight: 4, strokeOpacity: 0.8 }} />
      </GoogleMap>
    </div>
  );
}
