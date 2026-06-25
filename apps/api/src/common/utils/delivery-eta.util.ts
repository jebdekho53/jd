import { trafficSpeedFactor } from './geospatial.util';

export const DEFAULT_RIDER_SPEED_KMH = 25;
export const MAX_DELIVERY_DISTANCE_KM = 100;
export const MAX_REASONABLE_ETA_MINS = 180;

const POST_ASSIGNMENT_STATUSES = new Set([
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
]);

const POST_PICKUP_STATUSES = new Set(['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']);

export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns distance in km or null when coordinates are invalid or too far apart. */
export function safeDistanceKm(
  lat1?: number | null,
  lng1?: number | null,
  lat2?: number | null,
  lng2?: number | null,
): number | null {
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) return null;
  const km = haversineKm(lat1!, lng1!, lat2!, lng2!);
  if (km > MAX_DELIVERY_DISTANCE_KM) return null;
  return Math.round(km * 100) / 100;
}

export function minutesAtSpeedKm(km: number, speedKmh = DEFAULT_RIDER_SPEED_KMH, trafficFactor = 1): number {
  const effectiveSpeed = speedKmh * Math.max(0.5, Math.min(1.5, trafficFactor));
  return Math.max(1, Math.round((km / effectiveSpeed) * 60));
}

export interface DeliveryEtaInput {
  orderStatus: string;
  deliveryStatus?: string | null;
  storeLat?: number | null;
  storeLng?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  riderLat?: number | null;
  riderLng?: number | null;
  pickedUpAt?: Date | string | null;
  hasActiveAssignment?: boolean;
  /** When set, suppress ETA when store→customer distance exceeds this radius. */
  deliveryRadiusKm?: number | null;
}

export interface DeliveryEtaResult {
  estimatedMins: number | null;
  liveTrackingAvailable: boolean;
  etaAvailable: boolean;
}

export function computeDeliveryEta(input: DeliveryEtaInput): DeliveryEtaResult {
  const liveTrackingAvailable =
    POST_ASSIGNMENT_STATUSES.has(input.orderStatus) &&
    Boolean(input.hasActiveAssignment) &&
    isValidCoordinate(input.riderLat, input.riderLng);

  if (!POST_ASSIGNMENT_STATUSES.has(input.orderStatus) || !input.hasActiveAssignment) {
    return { estimatedMins: null, liveTrackingAvailable: false, etaAvailable: false };
  }

  const storeLat = input.storeLat ?? null;
  const storeLng = input.storeLng ?? null;
  const customerLat = input.customerLat ?? null;
  const customerLng = input.customerLng ?? null;

  const storeToCustomer = safeDistanceKm(storeLat, storeLng, customerLat, customerLng);
  if (storeToCustomer == null) {
    return { estimatedMins: null, liveTrackingAvailable, etaAvailable: false };
  }
  if (input.deliveryRadiusKm != null && storeToCustomer > input.deliveryRadiusKm) {
    return { estimatedMins: null, liveTrackingAvailable, etaAvailable: false };
  }

  const traffic = trafficSpeedFactor();

  const pickedUp =
    input.pickedUpAt != null ||
    POST_PICKUP_STATUSES.has(input.orderStatus) ||
    input.deliveryStatus === 'PICKED_UP' ||
    input.deliveryStatus === 'ARRIVED_AT_CUSTOMER' ||
    input.deliveryStatus === 'DELIVERED';

  let totalKm: number | null;

  if (!pickedUp) {
    const riderToStore = safeDistanceKm(input.riderLat, input.riderLng, storeLat, storeLng);
    if (riderToStore == null) {
      return { estimatedMins: null, liveTrackingAvailable, etaAvailable: false };
    }
    totalKm = riderToStore + storeToCustomer;
  } else {
    const riderToCustomer = safeDistanceKm(input.riderLat, input.riderLng, customerLat, customerLng);
    if (riderToCustomer == null) {
      return { estimatedMins: null, liveTrackingAvailable, etaAvailable: false };
    }
    totalKm = riderToCustomer;
  }

  if (totalKm == null) {
    return { estimatedMins: null, liveTrackingAvailable, etaAvailable: false };
  }

  const estimatedMins = minutesAtSpeedKm(totalKm, DEFAULT_RIDER_SPEED_KMH, traffic);
  if (estimatedMins > MAX_REASONABLE_ETA_MINS) {
    return { estimatedMins: null, liveTrackingAvailable, etaAvailable: false };
  }

  return {
    estimatedMins,
    liveTrackingAvailable,
    etaAvailable: true,
  };
}

export interface CoordinateAuditInput {
  orderId: string;
  orderNumber?: string;
  orderStatus?: string;
  storeLat?: number | null;
  storeLng?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  riderLat?: number | null;
  riderLng?: number | null;
  deliveryDistanceKm?: number | null;
}

export function auditDeliveryCoordinates(input: CoordinateAuditInput): string[] {
  const warnings: string[] = [];
  const tag = `order=${input.orderId}${input.orderNumber ? ` (${input.orderNumber})` : ''}`;

  if (!isValidCoordinate(input.storeLat, input.storeLng)) {
    warnings.push(`${tag}: invalid or missing store coordinates`);
  }
  if (!isValidCoordinate(input.customerLat, input.customerLng)) {
    warnings.push(`${tag}: invalid or missing customer delivery coordinates`);
  }
  if (
    input.deliveryDistanceKm != null &&
    (input.deliveryDistanceKm > MAX_DELIVERY_DISTANCE_KM || input.deliveryDistanceKm <= 0)
  ) {
    warnings.push(`${tag}: stored delivery distance invalid (${input.deliveryDistanceKm} km)`);
  }
  if (
    input.orderStatus &&
    POST_ASSIGNMENT_STATUSES.has(input.orderStatus) &&
    !isValidCoordinate(input.riderLat, input.riderLng)
  ) {
    warnings.push(`${tag}: rider assigned but rider location missing`);
  }

  return warnings;
}
