'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';
import { DEFAULT_MAP_CENTER } from './constants';
import { cn } from './cn';
import type { OsmMapPickerProps } from './osm-map-picker';

export function OsmMapPickerInner(props: OsmMapPickerProps) {
  const [MapView, setMapView] = useState<ComponentType<OsmMapPickerProps> | null>(null);

  useEffect(() => {
    void import('./osm-map-picker-leaflet').then((mod) => setMapView(() => mod.OsmMapPickerLeaflet));
  }, []);

  if (!MapView) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600',
          props.heightClassName ?? 'h-48 sm:h-56',
          props.className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading map…
      </div>
    );
  }

  return <MapView {...props} />;
}

export function getOsmMapCenter(position: OsmMapPickerProps['position']) {
  return {
    lat: position.lat || DEFAULT_MAP_CENTER.lat,
    lng: position.lng || DEFAULT_MAP_CENTER.lng,
  };
}
