'use client';

import { useMemo } from 'react';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface DeliveryMapProps {
  store: MapPoint;
  customer: MapPoint;
  rider?: MapPoint | null;
  route?: Array<{ lat: number; lng: number }>;
  className?: string;
}

function project(
  points: Array<{ lat: number; lng: number }>,
  width: number,
  height: number,
  padding: number,
) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.002);
  const lngSpan = Math.max(maxLng - minLng, 0.002);

  return (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / lngSpan) * (width - padding * 2);
    const y = padding + ((maxLat - lat) / latSpan) * (height - padding * 2);
    return { x, y };
  };
}

export function DeliveryMap({ store, customer, rider, route = [], className }: DeliveryMapProps) {
  const width = 400;
  const height = 280;
  const padding = 24;

  const allPoints = useMemo(() => {
    const pts = [store, customer, ...route];
    if (rider?.lat != null && rider.lng != null) pts.push(rider as MapPoint);
    return pts.filter((p) => p.lat != null && p.lng != null);
  }, [store, customer, rider, route]);

  const toSvg = useMemo(
    () => project(allPoints, width, height, padding),
    [allPoints],
  );

  const storePt = toSvg(store.lat, store.lng);
  const customerPt = toSvg(customer.lat, customer.lng);
  const riderPt =
    rider?.lat != null && rider.lng != null ? toSvg(rider.lat, rider.lng) : null;

  const routePath =
    route.length > 1
      ? route.map((p, i) => {
          const { x, y } = toSvg(p.lat, p.lng);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ')
      : riderPt
        ? `M ${storePt.x} ${storePt.y} L ${riderPt.x} ${riderPt.y} L ${customerPt.x} ${customerPt.y}`
        : `M ${storePt.x} ${storePt.y} L ${customerPt.x} ${customerPt.y}`;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full rounded-xl border bg-slate-50"
        role="img"
        aria-label="Delivery route map"
      >
        <rect width={width} height={height} fill="#f1f5f9" rx="12" />
        <path d={routePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle cx={storePt.x} cy={storePt.y} r="8" fill="#16a34a" />
        <text x={storePt.x + 12} y={storePt.y + 4} fontSize="11" fill="#166534">Store</text>
        <circle cx={customerPt.x} cy={customerPt.y} r="8" fill="#2563eb" />
        <text x={customerPt.x + 12} y={customerPt.y + 4} fontSize="11" fill="#1e40af">You</text>
        {riderPt && (
          <>
            <circle cx={riderPt.x} cy={riderPt.y} r="9" fill="#ea580c" stroke="#fff" strokeWidth="2" />
            <text x={riderPt.x + 12} y={riderPt.y + 4} fontSize="11" fill="#c2410c">Rider</text>
          </>
        )}
      </svg>
    </div>
  );
}
