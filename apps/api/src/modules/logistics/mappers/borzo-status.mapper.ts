import { ShipmentProviderStatus } from '@prisma/client';

/**
 * Borzo delivery statuses are the granular ones (courier_assigned, parcel_picked_up,
 * …). Order statuses (new/available/active/completed/canceled) are coarser; we map
 * both through this table, preferring the delivery status when the callback carries
 * one. See the "Delivery statuses" and "Order statuses" sections of the Borzo docs.
 */
const BORZO_STATUS_MAP: Record<string, ShipmentProviderStatus> = {
  // Order statuses
  new: ShipmentProviderStatus.PENDING,
  available: ShipmentProviderStatus.PENDING,
  reactivated: ShipmentProviderStatus.PENDING,
  active: ShipmentProviderStatus.IN_TRANSIT,
  completed: ShipmentProviderStatus.DELIVERED,
  delayed: ShipmentProviderStatus.PENDING,
  canceled: ShipmentProviderStatus.CANCELLED,
  cancelled: ShipmentProviderStatus.CANCELLED,

  // Delivery statuses
  planned: ShipmentProviderStatus.PENDING,
  invalid: ShipmentProviderStatus.FAILED,
  draft: ShipmentProviderStatus.PENDING,
  courier_assigned: ShipmentProviderStatus.ASSIGNED,
  courier_departed: ShipmentProviderStatus.PICKUP_STARTED,
  courier_at_pickup: ShipmentProviderStatus.PICKUP_STARTED,
  parcel_picked_up: ShipmentProviderStatus.PICKED_UP,
  courier_arrived: ShipmentProviderStatus.NEARBY,
  finished: ShipmentProviderStatus.DELIVERED,
  deleted: ShipmentProviderStatus.CANCELLED,

  // Return / reattempt flows
  return_planned: ShipmentProviderStatus.RETURNED,
  return_courier_assigned: ShipmentProviderStatus.RETURNED,
  return_courier_departed: ShipmentProviderStatus.RETURNED,
  return_courier_picked_up: ShipmentProviderStatus.RETURNED,
  return_finished: ShipmentProviderStatus.RETURNED,
  reattempt_planned: ShipmentProviderStatus.IN_TRANSIT,
  reattempt_courier_assigned: ShipmentProviderStatus.ASSIGNED,
  reattempt_courier_departed: ShipmentProviderStatus.PICKUP_STARTED,
  reattempt_courier_picked_up: ShipmentProviderStatus.PICKED_UP,
  reattempt_finished: ShipmentProviderStatus.DELIVERED,
};

export function mapBorzoStatus(raw: string | undefined | null): ShipmentProviderStatus {
  if (!raw) return ShipmentProviderStatus.PENDING;
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  return BORZO_STATUS_MAP[key] ?? ShipmentProviderStatus.PENDING;
}

export function borzoStatusTable(): Array<{ provider: string; normalized: ShipmentProviderStatus }> {
  return Object.entries(BORZO_STATUS_MAP).map(([provider, normalized]) => ({ provider, normalized }));
}
