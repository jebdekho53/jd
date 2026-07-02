'use client';

import { useEffect, useMemo, useRef } from 'react';

export interface AdvancedMarkerProps {
  map: google.maps.Map | null;
  position: google.maps.LatLngLiteral;
  title?: string;
  label?: string;
  draggable?: boolean;
  color?: string;
  onClick?: () => void;
  onDragEnd?: (position: google.maps.LatLngLiteral) => void;
}

function markerContent(label?: string, color = '#16a34a'): HTMLElement {
  const el = document.createElement('div');
  el.style.width = '28px';
  el.style.height = '28px';
  el.style.borderRadius = '999px';
  el.style.background = color;
  el.style.border = '2px solid #ffffff';
  el.style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.22)';
  el.style.display = 'grid';
  el.style.placeItems = 'center';
  el.style.color = '#ffffff';
  el.style.fontSize = '12px';
  el.style.fontWeight = '700';
  el.textContent = label ?? '';
  return el;
}

function eventPosition(
  marker: google.maps.marker.AdvancedMarkerElement,
  event?: google.maps.MapMouseEvent,
): google.maps.LatLngLiteral | null {
  const latLng = event?.latLng;
  if (latLng) return { lat: latLng.lat(), lng: latLng.lng() };
  const pos = marker.position;
  if (!pos) return null;
  if (pos instanceof google.maps.LatLng) return { lat: pos.lat(), lng: pos.lng() };
  if (typeof pos.lat === 'number' && typeof pos.lng === 'number') {
    return { lat: pos.lat, lng: pos.lng };
  }
  return null;
}

export function AdvancedMarker({
  map,
  position,
  title,
  label,
  draggable,
  color,
  onClick,
  onDragEnd,
}: AdvancedMarkerProps) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const content = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return markerContent(label, color);
  }, [color, label]);

  // Keep latest callbacks in refs so the marker is created only once per
  // (map, content). Previously the effect depended on position/onClick/onDragEnd
  // (new refs each render), so it destroyed + recreated the marker on every
  // render — spamming the "map initialized without a valid Map ID" warning.
  const onClickRef = useRef(onClick);
  const onDragEndRef = useRef(onDragEnd);
  onClickRef.current = onClick;
  onDragEndRef.current = onDragEnd;

  useEffect(() => {
    if (!map || !content || !google.maps.marker?.AdvancedMarkerElement) return undefined;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title,
      content,
      gmpDraggable: Boolean(draggable),
    });
    markerRef.current = marker;

    const listeners: google.maps.MapsEventListener[] = [
      marker.addListener('click', () => onClickRef.current?.()),
      marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        const next = eventPosition(marker, event);
        if (next) onDragEndRef.current?.(next);
      }),
    ];

    return () => {
      listeners.forEach((listener) => listener.remove());
      marker.map = null;
      markerRef.current = null;
    };
    // Only (map, content); position/title/draggable are synced in the effect
    // below and callbacks come from refs, so no need to recreate the marker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, map]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.position = position;
      markerRef.current.title = title ?? '';
      markerRef.current.gmpDraggable = Boolean(draggable);
    }
  }, [draggable, position, title]);

  return null;
}
