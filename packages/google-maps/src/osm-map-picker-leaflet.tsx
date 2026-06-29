'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { DEFAULT_MAP_ZOOM } from './constants';
import { cn } from './cn';
import type { OsmMapPickerProps } from './osm-map-picker';
import { getOsmMapCenter } from './osm-map-picker-inner';

import 'leaflet/dist/leaflet.css';

const storePinIcon = L.divIcon({
  className: '',
  html: `<span style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:9999px;background:#2563eb;color:white;box-shadow:0 4px 12px rgba(37,99,235,0.45);font-size:18px;line-height:1;">📍</span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom() || DEFAULT_MAP_ZOOM, { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({
  disabled,
  onPositionChange,
}: Pick<OsmMapPickerProps, 'disabled' | 'onPositionChange'>) {
  useMapEvents({
    click(event) {
      if (disabled) return;
      onPositionChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export function OsmMapPickerLeaflet({
  position,
  onPositionChange,
  className,
  heightClassName = 'h-48 sm:h-56',
  disabled,
}: OsmMapPickerProps) {
  const center = getOsmMapCenter(position);

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-slate-200 shadow-sm',
          heightClassName,
        )}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={DEFAULT_MAP_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter lat={center.lat} lng={center.lng} />
          <MapClickHandler disabled={disabled} onPositionChange={onPositionChange} />
          <Marker
            position={[center.lat, center.lng]}
            icon={storePinIcon}
            draggable={!disabled}
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const next = marker.getLatLng();
                onPositionChange({ lat: next.lat, lng: next.lng });
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3" aria-hidden />
        Tap the map or drag the pin to set your store location
      </p>
    </div>
  );
}
