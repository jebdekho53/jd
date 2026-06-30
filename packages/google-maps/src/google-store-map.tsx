'use client';

import { useMemo, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from './google-maps-context';
import { DEFAULT_MAP_ZOOM } from './constants';
import { cn } from './cn';
import { AdvancedMarker } from './advanced-marker';
export interface StoreMapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface GoogleStoreMapProps {
  buyerLat: number;
  buyerLng: number;
  stores: StoreMapPin[];
  className?: string;
  onSelectStore?: (store: StoreMapPin) => void;
  selectedStoreId?: string | null;
}

const mapContainerStyle = { width: '100%', height: '100%' };

export function GoogleStoreMap({
  buyerLat,
  buyerLng,
  stores,
  className,
  onSelectStore,
  selectedStoreId,
}: GoogleStoreMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(
    () => ({ lat: buyerLat, lng: buyerLng }),
    [buyerLat, buyerLng],
  );

  if (loadError) {
    return (
      <div
        className={cn(
          'flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 p-4 text-sm text-red-700',
          className,
        )}
      >
        Could not load map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          'flex min-h-[240px] items-center justify-center gap-2 rounded-2xl border border-border bg-cream-3 text-sm text-jd-text-muted',
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading map…
      </div>
    );
  }

  return (
    <div className={cn('h-64 w-full overflow-hidden rounded-2xl border border-border shadow-card sm:h-80', className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
      >
        <AdvancedMarker
          map={map}
          position={center}
          title="You"
          label="Y"
          color="#16a34a"
        />
        {stores.map((store) => (
          <AdvancedMarker
            key={store.id}
            map={map}
            position={{ lat: store.lat, lng: store.lng }}
            title={store.name}
            onClick={() => onSelectStore?.(store)}
            label={selectedStoreId === store.id ? 'S' : undefined}
            color={selectedStoreId === store.id ? '#15803d' : '#16a34a'}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
