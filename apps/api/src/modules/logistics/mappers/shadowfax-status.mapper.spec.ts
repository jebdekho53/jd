import { DeliveryStatus, ShipmentProviderStatus } from '@prisma/client';
import {
  mapShadowfaxStatus,
  normalizedToDeliveryStatus,
} from './shadowfax-status.mapper';

describe('shadowfax-status.mapper', () => {
  it('maps known Shadowfax statuses to normalized values', () => {
    expect(mapShadowfaxStatus('new')).toBe(ShipmentProviderStatus.PENDING);
    expect(mapShadowfaxStatus('assigned')).toBe(ShipmentProviderStatus.ASSIGNED);
    expect(mapShadowfaxStatus('ofp')).toBe(ShipmentProviderStatus.PICKUP_STARTED);
    expect(mapShadowfaxStatus('picked')).toBe(ShipmentProviderStatus.PICKED_UP);
    expect(mapShadowfaxStatus('dispatched')).toBe(ShipmentProviderStatus.IN_TRANSIT);
    expect(mapShadowfaxStatus('delivered')).toBe(ShipmentProviderStatus.DELIVERED);
    expect(mapShadowfaxStatus('cancelled')).toBe(ShipmentProviderStatus.CANCELLED);
    expect(mapShadowfaxStatus('rto')).toBe(ShipmentProviderStatus.RETURNED);
  });

  it('defaults unknown statuses to PENDING', () => {
    expect(mapShadowfaxStatus('something_new')).toBe(ShipmentProviderStatus.PENDING);
    expect(mapShadowfaxStatus(null)).toBe(ShipmentProviderStatus.PENDING);
  });

  it('maps normalized status to delivery status', () => {
    expect(normalizedToDeliveryStatus(ShipmentProviderStatus.PICKED_UP)).toBe(
      DeliveryStatus.PICKED_UP,
    );
    expect(normalizedToDeliveryStatus(ShipmentProviderStatus.NEARBY)).toBe(
      DeliveryStatus.IN_TRANSIT,
    );
    expect(normalizedToDeliveryStatus(ShipmentProviderStatus.DELIVERED)).toBe(
      DeliveryStatus.DELIVERED,
    );
  });
});
