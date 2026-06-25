import { haversineKm, isValidCoordinate, safeDistanceKm } from './delivery-eta.util';

/** Admin-configurable store delivery radii (km). */
export const ALLOWED_DELIVERY_RADII_KM = [1, 3, 5, 8, 10] as const;
export const DEFAULT_DELIVERY_RADIUS_KM = 5;

export type DeliveryRadiusKm = (typeof ALLOWED_DELIVERY_RADII_KM)[number];

export function normalizeDeliveryRadiusKm(value?: number | null): number {
  if (value == null || !Number.isFinite(value)) return DEFAULT_DELIVERY_RADIUS_KM;
  const allowed = ALLOWED_DELIVERY_RADII_KM as readonly number[];
  if (allowed.includes(value)) return value;
  return allowed.reduce((best, r) =>
    Math.abs(r - value) < Math.abs(best - value) ? r : best,
  );
}

export interface DeliverableStoreShape {
  latitude: number;
  longitude: number;
  deliveryRadiusKm?: number | null;
  storeServiceAreas: Array<{
    serviceArea: { centerLat: number; centerLng: number; radiusKm: number };
  }>;
}

export interface DeliverabilityResult {
  deliverable: boolean;
  distanceKm: number | null;
  effectiveRadiusKm: number;
  reason?: string;
}

/**
 * Store is deliverable when buyer is within store delivery radius
 * OR within any linked service-area circle.
 */
export function checkStoreDeliverability(
  buyerLat: number,
  buyerLng: number,
  store: DeliverableStoreShape,
): DeliverabilityResult {
  if (!isValidCoordinate(buyerLat, buyerLng)) {
    return {
      deliverable: false,
      distanceKm: null,
      effectiveRadiusKm: normalizeDeliveryRadiusKm(store.deliveryRadiusKm),
      reason: 'Invalid buyer coordinates',
    };
  }

  const storeRadius = normalizeDeliveryRadiusKm(store.deliveryRadiusKm);
  const distanceToStore = haversineKm(buyerLat, buyerLng, store.latitude, store.longitude);
  const nearStore = distanceToStore <= storeRadius;

  if (store.storeServiceAreas.length === 0) {
    if (!nearStore) {
      return {
        deliverable: false,
        distanceKm: Math.round(distanceToStore * 100) / 100,
        effectiveRadiusKm: storeRadius,
        reason: 'Outside store delivery radius',
      };
    }
    return {
      deliverable: true,
      distanceKm: Math.round(distanceToStore * 100) / 100,
      effectiveRadiusKm: storeRadius,
    };
  }

  const serviceDistances = store.storeServiceAreas.map(({ serviceArea: sa }) =>
    haversineKm(buyerLat, buyerLng, sa.centerLat, sa.centerLng),
  );
  const inServiceArea = store.storeServiceAreas.some(
    ({ serviceArea: sa }, i) => serviceDistances[i] <= sa.radiusKm,
  );

  if (!nearStore && !inServiceArea) {
    return {
      deliverable: false,
      distanceKm: Math.round(distanceToStore * 100) / 100,
      effectiveRadiusKm: storeRadius,
      reason: 'Outside delivery zone',
    };
  }

  const effectiveDistance = nearStore ? distanceToStore : Math.min(...serviceDistances);
  return {
    deliverable: true,
    distanceKm: Math.round(effectiveDistance * 100) / 100,
    effectiveRadiusKm: storeRadius,
  };
}

/** Traffic-aware ETA abstraction: base speed adjusted by time-of-day factor. */
export function trafficSpeedFactor(date = new Date()): number {
  const hour = date.getHours();
  if (hour >= 8 && hour <= 10) return 0.85;
  if (hour >= 17 && hour <= 20) return 0.8;
  if (hour >= 12 && hour <= 14) return 0.9;
  return 1;
}

export function estimateDeliveryEtaMins(
  distanceKm: number,
  prepTimeMins = 0,
  speedKmh = 25,
  trafficFactor = 1,
): number | null {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return prepTimeMins > 0 ? prepTimeMins : null;
  const travelMins = Math.max(1, Math.round((distanceKm / (speedKmh * trafficFactor)) * 60));
  return prepTimeMins + travelMins;
}

export function estimateStoreToBuyerEta(
  storeLat: number,
  storeLng: number,
  buyerLat: number,
  buyerLng: number,
  prepTimeMins: number,
  maxRadiusKm: number,
): number | null {
  const km = safeDistanceKm(storeLat, storeLng, buyerLat, buyerLng);
  if (km == null || km > maxRadiusKm) return null;
  return estimateDeliveryEtaMins(km, prepTimeMins, 25, trafficSpeedFactor());
}
