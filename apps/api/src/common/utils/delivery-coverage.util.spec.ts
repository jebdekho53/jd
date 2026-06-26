import {
  checkStoreDeliverabilityWithCoverage,
  findActiveDeliveryArea,
  hasActiveDeliveryAreas,
  storeServesPincode,
} from './delivery-coverage.util';

describe('delivery-coverage.util', () => {
  const store = {
    latitude: 28.61,
    longitude: 77.21,
    deliveryRadiusKm: 3,
    storeServiceAreas: [],
    deliveryAreas: [
      { pincode: '201206', isActive: true, priority: 1 },
      { pincode: '201204', isActive: true, priority: 0 },
    ],
  };

  it('delivers when buyer pincode is in coverage', () => {
    expect(storeServesPincode(store, '201206')).toBe(true);
    const result = checkStoreDeliverabilityWithCoverage(28.7, 77.4, store, {
      buyerPincode: '201206',
    });
    expect(result.deliverable).toBe(true);
  });

  it('rejects pincode outside coverage when areas configured', () => {
    const result = checkStoreDeliverabilityWithCoverage(28.61, 77.21, store, {
      buyerPincode: '110001',
    });
    expect(result.deliverable).toBe(false);
    expect(result.reason).toContain('pincode');
  });

  it('picks highest priority delivery area', () => {
    const area = findActiveDeliveryArea(store.deliveryAreas, '201206');
    expect(area?.priority).toBe(1);
  });

  it('falls back to geo when no delivery areas configured', () => {
    const geoOnly = { ...store, deliveryAreas: [] };
    expect(hasActiveDeliveryAreas(geoOnly.deliveryAreas)).toBe(false);
    const near = checkStoreDeliverabilityWithCoverage(28.611, 77.211, geoOnly);
    expect(near.deliverable).toBe(true);
  });
});
