import { DeliveryStatus, ShipmentProviderStatus } from '@prisma/client';

const SHADOWFAX_STATUS_MAP: Record<string, ShipmentProviderStatus> = {
  new: ShipmentProviderStatus.PENDING,
  pending: ShipmentProviderStatus.PENDING,
  created: ShipmentProviderStatus.PENDING,
  assigned: ShipmentProviderStatus.ASSIGNED,
  allot: ShipmentProviderStatus.ASSIGNED,
  accepted: ShipmentProviderStatus.ASSIGNED,
  ofp: ShipmentProviderStatus.PICKUP_STARTED,
  out_for_pickup: ShipmentProviderStatus.PICKUP_STARTED,
  pickup_started: ShipmentProviderStatus.PICKUP_STARTED,
  picked: ShipmentProviderStatus.PICKED_UP,
  picked_up: ShipmentProviderStatus.PICKED_UP,
  dispatched: ShipmentProviderStatus.IN_TRANSIT,
  in_transit: ShipmentProviderStatus.IN_TRANSIT,
  ofd: ShipmentProviderStatus.IN_TRANSIT,
  out_for_delivery: ShipmentProviderStatus.IN_TRANSIT,
  nearby: ShipmentProviderStatus.NEARBY,
  reached: ShipmentProviderStatus.NEARBY,
  delivered: ShipmentProviderStatus.DELIVERED,
  cancelled: ShipmentProviderStatus.CANCELLED,
  canceled: ShipmentProviderStatus.CANCELLED,
  failed: ShipmentProviderStatus.FAILED,
  undelivered: ShipmentProviderStatus.FAILED,
  rto: ShipmentProviderStatus.RETURNED,
  returned: ShipmentProviderStatus.RETURNED,
};

export function mapShadowfaxStatus(raw: string | undefined | null): ShipmentProviderStatus {
  if (!raw) return ShipmentProviderStatus.PENDING;
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  return SHADOWFAX_STATUS_MAP[key] ?? ShipmentProviderStatus.PENDING;
}

/** Map normalized provider status to internal DeliveryStatus for existing tracking UI. */
export function normalizedToDeliveryStatus(status: ShipmentProviderStatus): DeliveryStatus {
  switch (status) {
    case ShipmentProviderStatus.PENDING:
      return DeliveryStatus.PENDING;
    case ShipmentProviderStatus.ASSIGNED:
    case ShipmentProviderStatus.PICKUP_STARTED:
      return DeliveryStatus.ASSIGNED;
    case ShipmentProviderStatus.PICKED_UP:
      return DeliveryStatus.PICKED_UP;
    case ShipmentProviderStatus.IN_TRANSIT:
    case ShipmentProviderStatus.NEARBY:
      return DeliveryStatus.IN_TRANSIT;
    case ShipmentProviderStatus.DELIVERED:
      return DeliveryStatus.DELIVERED;
    case ShipmentProviderStatus.FAILED:
      return DeliveryStatus.FAILED;
    case ShipmentProviderStatus.RETURNED:
    case ShipmentProviderStatus.CANCELLED:
      return DeliveryStatus.CANCELLED;
    default:
      return DeliveryStatus.PENDING;
  }
}

export function shadowfaxStatusTable(): Array<{ provider: string; normalized: ShipmentProviderStatus }> {
  return Object.entries(SHADOWFAX_STATUS_MAP).map(([provider, normalized]) => ({
    provider,
    normalized,
  }));
}
