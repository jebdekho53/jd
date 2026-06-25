'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { MapStorePin } from '@/services/geo/map-api';

interface StoreMapProps {
  buyerLat: number;
  buyerLng: number;
  stores: MapStorePin[];
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
  const latSpan = Math.max(maxLat - minLat, 0.005);
  const lngSpan = Math.max(maxLng - minLng, 0.005);

  return (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / lngSpan) * (width - padding * 2);
    const y = padding + ((maxLat - lat) / latSpan) * (height - padding * 2);
    return { x, y };
  };
}

export function StoreMap({ buyerLat, buyerLng, stores, className }: StoreMapProps) {
  const width = 480;
  const height = 320;
  const padding = 28;

  const allPoints = useMemo(
    () => [{ lat: buyerLat, lng: buyerLng }, ...stores.map((s) => ({ lat: s.lat, lng: s.lng }))],
    [buyerLat, buyerLng, stores],
  );

  const toSvg = useMemo(() => project(allPoints, width, height, padding), [allPoints]);
  const buyerPt = toSvg(buyerLat, buyerLng);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full rounded-xl border bg-slate-50"
        role="img"
        aria-label="Nearby stores map"
      >
        {stores.map((store) => {
          const pt = toSvg(store.lat, store.lng);
          return (
            <g key={store.id}>
              <circle cx={pt.x} cy={pt.y} r={10} fill="#0ea5e9" opacity={0.2} />
              <circle cx={pt.x} cy={pt.y} r={5} fill="#0284c7" />
              <title>{store.name}</title>
            </g>
          );
        })}
        <circle cx={buyerPt.x} cy={buyerPt.y} r={7} fill="#16a34a" stroke="#fff" strokeWidth={2} />
        <text x={buyerPt.x + 10} y={buyerPt.y + 4} className="fill-slate-600 text-[10px]">
          You
        </text>
      </svg>
    </div>
  );
}

export function StoreMapList({ stores }: { stores: MapStorePin[] }) {
  if (stores.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-jd-text-muted">
        No deliverable stores near your location.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {stores.map((store) => (
        <li key={store.id}>
          <Link
            href={`/stores/${store.slug}`}
            className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-muted/40"
          >
            <div className="min-w-0">
              <p className="font-medium text-jd-text-primary">{store.name}</p>
              <p className="text-xs text-jd-text-muted">
                {store.categories.slice(0, 2).join(' · ') || store.city}
                {store.locality ? ` · ${store.locality}` : ''}
              </p>
              {store.offer && (
                <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                  {store.offer.name}
                </span>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="font-medium">{store.distanceKm.toFixed(1)} km</p>
              <p className="text-xs text-jd-text-muted">
                {store.etaMins != null ? `~${store.etaMins} min` : '—'}
              </p>
              <p className="text-xs text-amber-600">★ {store.ratingAvg.toFixed(1)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
