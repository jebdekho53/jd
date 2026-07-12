import {
  ALLOWED_DELIVERY_RADII_KM,
  checkStoreDeliverability,
  estimateDeliveryEtaMins,
  normalizeDeliveryRadiusKm,
  trafficSpeedFactor,
} from './geospatial.util';

describe('geospatial.util', () => {
  const store = {
    latitude: 28.6139,
    longitude: 77.209,
    deliveryRadiusKm: 5,
    storeServiceAreas: [],
  };

  it('normalizes delivery radius to allowed values', () => {
    expect(normalizeDeliveryRadiusKm(4)).toBe(3);
    expect(normalizeDeliveryRadiusKm(5)).toBe(5);
    expect(normalizeDeliveryRadiusKm(null)).toBe(5);
  });

  it('marks buyer inside store radius as deliverable', () => {
    const result = checkStoreDeliverability(28.62, 77.21, store);
    expect(result.deliverable).toBe(true);
    expect(result.distanceKm).not.toBeNull();
  });

  it('marks buyer outside store radius as not deliverable', () => {
    const result = checkStoreDeliverability(28.7, 77.35, store);
    expect(result.deliverable).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('respects service area when store HQ is far', () => {
    const remote = {
      ...store,
      storeServiceAreas: [
        {
          serviceArea: { centerLat: 28.62, centerLng: 77.21, radiusKm: 2 },
        },
      ],
    };
    const result = checkStoreDeliverability(28.621, 77.211, remote);
    expect(result.deliverable).toBe(true);
  });

  it('applies traffic factor to ETA', () => {
    const peak = estimateDeliveryEtaMins(5, 10, 25, trafficSpeedFactor(new Date('2026-06-23T18:00:00')));
    const offPeak = estimateDeliveryEtaMins(5, 10, 25, trafficSpeedFactor(new Date('2026-06-23T03:00:00')));
    expect(peak).not.toBeNull();
    expect(offPeak).not.toBeNull();
    expect(peak!).toBeGreaterThanOrEqual(offPeak!);
  });

  it('exposes allowed radii', () => {
    expect(ALLOWED_DELIVERY_RADII_KM).toEqual([1, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50]);
  });
});
