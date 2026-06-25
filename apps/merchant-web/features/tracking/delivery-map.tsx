'use client';

import { useMemo } from 'react';

export interface MapPoint {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  store: MapPoint;
  customer: MapPoint;
  rider?: MapPoint | null;
  route?: Array<{ lat: number; lng: number }>;
  className?: string;
}

function project(points: Array<{ lat: number; lng: number }>, width: number, height: number, padding: number) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.002);
  const lngSpan = Math.max(maxLng - minLng, 0.002);
  return (lat: number, lng: number) => ({
    x: padding + ((lng - minLng) / lngSpan) * (width - padding * 2),
    y: padding + ((maxLat - lat) / latSpan) * (height - padding * 2),
  });
}

export function DeliveryMap({ store, customer, rider, route = [], className }: DeliveryMapProps) {
  const width = 400;
  const height = 240;
  const padding = 24;
  const allPoints = useMemo(() => {
    const pts = [store, customer, ...route];
    if (rider) pts.push(rider);
    return pts;
  }, [store, customer, rider, route]);
  const toSvg = useMemo(() => project(allPoints, width, height, padding), [allPoints]);
  const storePt = toSvg(store.lat, store.lng);
  const customerPt = toSvg(customer.lat, customer.lng);
  const riderPt = rider ? toSvg(rider.lat, rider.lng) : null;
  const routePath = route.length > 1
    ? route.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvg(p.lat, p.lng).x} ${toSvg(p.lat, p.lng).y}`).join(' ')
    : `M ${storePt.x} ${storePt.y} ${riderPt ? `L ${riderPt.x} ${riderPt.y}` : ''} L ${customerPt.x} ${customerPt.y}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className ?? 'w-full rounded-lg border bg-slate-50'}>
      <rect width={width} height={height} fill="#f8fafc" />
      <path d={routePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 4" />
      <circle cx={storePt.x} cy={storePt.y} r="7" fill="#16a34a" />
      <circle cx={customerPt.x} cy={customerPt.y} r="7" fill="#2563eb" />
      {riderPt && <circle cx={riderPt.x} cy={riderPt.y} r="8" fill="#ea580c" stroke="#fff" strokeWidth="2" />}
    </svg>
  );
}
