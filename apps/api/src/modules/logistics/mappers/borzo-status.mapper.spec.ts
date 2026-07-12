import { ShipmentProviderStatus } from '@prisma/client';
import { mapBorzoStatus } from './borzo-status.mapper';

describe('mapBorzoStatus', () => {
  it('maps order statuses to normalized statuses', () => {
    expect(mapBorzoStatus('new')).toBe(ShipmentProviderStatus.PENDING);
    expect(mapBorzoStatus('available')).toBe(ShipmentProviderStatus.PENDING);
    expect(mapBorzoStatus('active')).toBe(ShipmentProviderStatus.IN_TRANSIT);
    expect(mapBorzoStatus('completed')).toBe(ShipmentProviderStatus.DELIVERED);
    expect(mapBorzoStatus('canceled')).toBe(ShipmentProviderStatus.CANCELLED);
  });

  it('maps the granular delivery statuses', () => {
    expect(mapBorzoStatus('courier_assigned')).toBe(ShipmentProviderStatus.ASSIGNED);
    expect(mapBorzoStatus('courier_at_pickup')).toBe(ShipmentProviderStatus.PICKUP_STARTED);
    expect(mapBorzoStatus('parcel_picked_up')).toBe(ShipmentProviderStatus.PICKED_UP);
    expect(mapBorzoStatus('courier_arrived')).toBe(ShipmentProviderStatus.NEARBY);
    expect(mapBorzoStatus('finished')).toBe(ShipmentProviderStatus.DELIVERED);
    expect(mapBorzoStatus('return_finished')).toBe(ShipmentProviderStatus.RETURNED);
  });

  it('is case- and whitespace-insensitive and defaults to PENDING', () => {
    expect(mapBorzoStatus('Parcel Picked Up')).toBe(ShipmentProviderStatus.PICKED_UP);
    expect(mapBorzoStatus(undefined)).toBe(ShipmentProviderStatus.PENDING);
    expect(mapBorzoStatus('who_knows')).toBe(ShipmentProviderStatus.PENDING);
  });
});
