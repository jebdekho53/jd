'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Star, Store } from 'lucide-react';
import { BottomSheet } from '@/design-system/primitives';
import { GoogleStoreMap, useGoogleMaps } from '@jebdekho/google-maps';
import type { MapStorePin } from '@/services/geo/map-api';

interface StoreMapProps {
  buyerLat: number;
  buyerLng: number;
  stores: MapStorePin[];
  className?: string;
  onSelectStore?: (store: MapStorePin) => void;
  selectedStoreId?: string | null;
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

function SvgStoreMap({
  buyerLat,
  buyerLng,
  stores,
  className,
  onSelectStore,
  selectedStoreId,
}: StoreMapProps) {
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
        className="h-auto w-full rounded-2xl border border-border bg-cream-3 shadow-card"
        role="img"
        aria-label="Nearby stores map"
      >
        {stores.map((store) => {
          const pt = toSvg(store.lat, store.lng);
          const selected = selectedStoreId === store.id;
          return (
            <g
              key={store.id}
              className="cursor-pointer"
              onClick={() => onSelectStore?.(store)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectStore?.(store);
              }}
              role="button"
              tabIndex={0}
              aria-label={`${store.name}, ${store.distanceKm.toFixed(1)} km away`}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={selected ? 16 : 14}
                fill="hsl(var(--primary))"
                opacity={selected ? 0.25 : 0.15}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={selected ? 7 : 6}
                fill="hsl(var(--primary))"
                stroke="#fff"
                strokeWidth={2}
              />
              <title>{store.name}</title>
            </g>
          );
        })}
        <circle cx={buyerPt.x} cy={buyerPt.y} r={8} fill="#16a34a" stroke="#fff" strokeWidth={2} />
        <text x={buyerPt.x + 12} y={buyerPt.y + 4} className="fill-jd-text-muted text-[11px] font-medium">
          You
        </text>
      </svg>
    </div>
  );
}

export function StoreMap(props: StoreMapProps) {
  const { isConfigured, isLoaded } = useGoogleMaps();
  if (isConfigured && isLoaded) {
    return (
      <GoogleStoreMap
        buyerLat={props.buyerLat}
        buyerLng={props.buyerLng}
        className={props.className}
        onSelectStore={
          props.onSelectStore
            ? (store) => {
                const match = props.stores.find((s) => s.id === store.id);
                if (match) props.onSelectStore?.(match);
              }
            : undefined
        }
        selectedStoreId={props.selectedStoreId}
        stores={props.stores.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng }))}
      />
    );
  }
  return <SvgStoreMap {...props} />;
}

export function StoreMapList({
  stores,
  onSelectStore,
}: {
  stores: MapStorePin[];
  onSelectStore?: (store: MapStorePin) => void;
}) {
  if (stores.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-jd-text-muted">
        No deliverable stores near your location.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {stores.map((store) => (
        <li key={store.id}>
          <button
            type="button"
            onClick={() => onSelectStore?.(store)}
            className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-muted/40"
          >
            <div className="min-w-0">
              <p className="font-semibold text-jd-text-primary">{store.name}</p>
              <p className="mt-0.5 text-xs text-jd-text-muted">
                {store.categories.slice(0, 2).join(' · ') || store.city}
                {store.locality ? ` · ${store.locality}` : ''}
              </p>
              {store.offer && (
                <span className="mt-1.5 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-jd-text-primary">
                  {store.offer.name}
                </span>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="font-bold text-primary">{store.distanceKm.toFixed(1)} km</p>
              <p className="mt-0.5 flex items-center justify-end gap-0.5 text-xs text-jd-text-muted">
                <Clock className="h-3 w-3" aria-hidden />
                {store.etaMins != null ? `~${store.etaMins} min` : '—'}
              </p>
              <p className="mt-0.5 flex items-center justify-end gap-0.5 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-amber-400" aria-hidden />
                {store.ratingAvg.toFixed(1)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function StoreMapPreviewSheet({
  store,
  open,
  onClose,
}: {
  store: MapStorePin | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!store) return null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={store.name}
      size="sm"
      footer={
        <Link
          href={`/stores/${store.slug}`}
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground btn-press"
        >
          View store
        </Link>
      }
    >
      <div className="space-y-3 pb-2 text-sm">
        <p className="flex items-center gap-2 text-jd-text-muted">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {store.locality ? `${store.locality}, ` : ''}
          {store.city}
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1 font-medium">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {store.ratingAvg.toFixed(1)}
          </span>
          <span>{store.distanceKm.toFixed(1)} km away</span>
          {store.etaMins != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden />
              ~{store.etaMins} min
            </span>
          )}
        </div>
        {store.offer && (
          <div className="rounded-xl bg-accent/10 px-3 py-2 text-xs font-medium text-jd-text-primary">
            {store.offer.name}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-jd-text-muted">
          <Store className="h-4 w-4" aria-hidden />
          {store.categories.slice(0, 3).join(' · ') || 'Grocery'}
        </div>
      </div>
    </BottomSheet>
  );
}
