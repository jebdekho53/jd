import { ShipmentProviderStatus } from '@prisma/client';

/** Buyer/merchant-facing labels — never expose raw provider statuses. */
export const NORMALIZED_STATUS_LABELS: Record<ShipmentProviderStatus, string> = {
  [ShipmentProviderStatus.PENDING]: 'Shipment created',
  [ShipmentProviderStatus.ASSIGNED]: 'Delivery partner assigned',
  [ShipmentProviderStatus.PICKUP_STARTED]: 'Partner heading to store',
  [ShipmentProviderStatus.PICKED_UP]: 'Order picked up',
  [ShipmentProviderStatus.IN_TRANSIT]: 'On the way',
  [ShipmentProviderStatus.NEARBY]: 'Almost there',
  [ShipmentProviderStatus.DELIVERED]: 'Delivered',
  [ShipmentProviderStatus.FAILED]: 'Delivery failed',
  [ShipmentProviderStatus.RETURNED]: 'Returned to store',
  [ShipmentProviderStatus.CANCELLED]: 'Shipment cancelled',
};

export function labelForNormalizedStatus(status: string): string {
  return NORMALIZED_STATUS_LABELS[status as ShipmentProviderStatus] ?? 'In progress';
}
