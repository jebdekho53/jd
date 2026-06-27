'use client';

import { useMemo } from 'react';
import { AdminGoogleMap, type AdminMapCircle, type AdminMapMarker } from '@/components/maps/admin-google-map';
import type { OpsMapData } from '@/features/maps/use-operations-map';

interface OpsMapOverlayProps {
  data: OpsMapData;
  showStores?: boolean;
  showRiders?: boolean;
  showUnassigned?: boolean;
  showZones?: boolean;
  showFranchise?: boolean;
  showShipments?: boolean;
  className?: string;
}

export function OpsMapOverlay({
  data,
  showStores = true,
  showRiders = true,
  showUnassigned = true,
  showZones = true,
  showFranchise = false,
  showShipments = false,
  className,
}: OpsMapOverlayProps) {
  const markers = useMemo(() => {
    const pts: AdminMapMarker[] = [];
    if (showStores) {
      for (const s of data.stores) {
        pts.push({ id: `store-${s.id}`, lat: s.latitude, lng: s.longitude, color: '#0284c7', title: s.name });
      }
    }
    if (showRiders) {
      for (const r of data.fleet.riders) {
        if (!r.location) continue;
        pts.push({
          id: `rider-${r.id}`,
          lat: r.location.lat,
          lng: r.location.lng,
          color: r.currentDelivery ? '#ea580c' : '#16a34a',
          title: r.name,
        });
      }
    }
    if (showUnassigned) {
      for (const o of data.unassignedOrders) {
        pts.push({
          id: `unassigned-${o.id}`,
          lat: o.deliveryLat,
          lng: o.deliveryLng,
          color: '#dc2626',
          title: o.orderNumber,
        });
      }
    }
    if (showFranchise) {
      for (const t of data.franchiseTerritories ?? []) {
        const store = data.stores.find((s) => s.locality?.includes(t.city) || s.name.includes(t.city));
        if (store) {
          pts.push({
            id: `franchise-${t.id}`,
            lat: store.latitude,
            lng: store.longitude,
            color: t.color,
            title: t.franchise.businessName,
          });
        }
      }
    }
    if (showShipments) {
      for (const d of data.activeDeliveries) {
        pts.push({
          id: `shipment-${d.riderId}`,
          lat: d.lat,
          lng: d.lng,
          color: '#7c3aed',
          label: 'S',
          title: `${d.riderName} → ${d.order.orderNumber}`,
        });
      }
    }
    return pts;
  }, [data, showStores, showRiders, showUnassigned, showFranchise, showShipments]);

  const circles = useMemo(() => {
    if (!showZones) return [];
    const c: AdminMapCircle[] = [];
    for (const z of data.zones) {
      c.push({
        id: `zone-${z.id}`,
        lat: z.centerLat,
        lng: z.centerLng,
        radiusMeters: z.radiusKm * 1000,
        strokeColor: '#94a3b8',
        fillColor: '#94a3b8',
      });
    }
    if (showStores) {
      for (const s of data.stores) {
        c.push({
          id: `radius-${s.id}`,
          lat: s.latitude,
          lng: s.longitude,
          radiusMeters: s.deliveryRadiusKm * 1000,
          strokeColor: '#0284c7',
          fillColor: '#0284c7',
        });
      }
    }
    return c;
  }, [data, showZones, showStores]);

  return <AdminGoogleMap markers={markers} circles={circles} className={className} />;
}
