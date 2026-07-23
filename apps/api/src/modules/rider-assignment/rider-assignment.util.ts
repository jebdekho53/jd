import { DeliveryStatus, OrderStatus, Prisma } from '@prisma/client';

export const MAX_ACTIVE_DELIVERIES = 1;
export const ASSIGNMENT_OFFER_SECONDS = 30;

const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.ACCEPTED,
  DeliveryStatus.ARRIVED_AT_STORE,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.ARRIVED_AT_CUSTOMER,
];

/** Orders waiting for rider assignment — single source of truth for admin/fleet/assignment.
 *  SELF-delivery stores never get a platform rider — the merchant IS the courier
 *  (see order.service.ts's SELF_DELIVERY_MERCHANT_FORWARD) — so their orders must
 *  never inflate this queue or be eligible for assign/reassign. */
export function unassignedOrderWhere(): Prisma.OrderWhereInput {
  return {
    status: OrderStatus.READY_FOR_PICKUP,
    store: { deliveryMode: { not: 'SELF' } },
    OR: [{ delivery: { is: null } }, { delivery: { status: DeliveryStatus.CANCELLED } }],
  };
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

export function minutesSince(date: Date | string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
}

export function isActiveDeliveryStatus(status: DeliveryStatus): boolean {
  return ACTIVE_DELIVERY_STATUSES.includes(status);
}

export function activeDeliveryStatuses(): DeliveryStatus[] {
  return [...ACTIVE_DELIVERY_STATUSES];
}

export interface ScoredRider {
  id: string;
  activeDeliveries: number;
  distanceKm: number;
  idleMins: number;
  inZone: boolean;
  score: number;
}

/** Lower score = better rider. Priority: zone → fewest deliveries → closest → longest idle. */
export function scoreRider(input: {
  inZone: boolean;
  activeDeliveries: number;
  distanceKm: number;
  idleMins: number;
}): number {
  if (!input.inZone) return Number.POSITIVE_INFINITY;
  return input.activeDeliveries * 10_000 + input.distanceKm * 100 - input.idleMins;
}
