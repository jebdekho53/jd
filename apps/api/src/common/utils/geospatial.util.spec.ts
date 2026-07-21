import {
  ALLOWED_DELIVERY_RADII_KM,
  DEFAULT_DELIVERY_RADIUS_KM,
  checkStoreDeliverability,
  estimateDeliveryEtaMins,
  normalizeDeliveryRadiusKm,
  trafficSpeedFactor,
} from './geospatial.util';

describe('normalizeDeliveryRadiusKm', () => {
  it('passes allowed radii through unchanged', () => {
    for (const r of ALLOWED_DELIVERY_RADII_KM) {
      expect(normalizeDeliveryRadiusKm(r)).toBe(r);
    }
  });

  it('snaps an arbitrary value to the nearest allowed radius', () => {
    expect(normalizeDeliveryRadiusKm(7)).toBe(8);
    expect(normalizeDeliveryRadiusKm(2.2)).toBe(3);
    expect(normalizeDeliveryRadiusKm(4.4)).toBe(5);
    expect(normalizeDeliveryRadiusKm(100)).toBe(50);
  });

  it('breaks an exact tie toward the lower allowed radius', () => {
    // 2 is equidistant from 1 and 3 → lower wins
    expect(normalizeDeliveryRadiusKm(2)).toBe(1);
  });

  it('falls back to the default for null/NaN', () => {
    expect(normalizeDeliveryRadiusKm(null)).toBe(DEFAULT_DELIVERY_RADIUS_KM);
    expect(normalizeDeliveryRadiusKm(NaN)).toBe(DEFAULT_DELIVERY_RADIUS_KM);
  });
});

describe('checkStoreDeliverability', () => {
  const store = {
    latitude: 28.61,
    longitude: 77.23,
    deliveryRadiusKm: 5,
    storeServiceAreas: [],
  };

  it('is deliverable when the buyer is inside the store radius', () => {
    const r = checkStoreDeliverability(28.615, 77.235, store);
    expect(r.deliverable).toBe(true);
    expect(r.distanceKm).not.toBeNull();
  });

  it('is not deliverable outside the radius with no service areas', () => {
    const r = checkStoreDeliverability(29.5, 78.5, store);
    expect(r.deliverable).toBe(false);
    expect(r.reason).toBe('Outside store delivery radius');
  });

  it('rejects invalid buyer coordinates', () => {
    const r = checkStoreDeliverability(0, 0, store);
    expect(r.deliverable).toBe(false);
    expect(r.reason).toBe('Invalid buyer coordinates');
  });

  it('is deliverable when the buyer falls inside a linked service area but outside the store radius', () => {
    const withArea = {
      ...store,
      deliveryRadiusKm: 1,
      storeServiceAreas: [
        { serviceArea: { centerLat: 29.5, centerLng: 78.5, radiusKm: 10 } },
      ],
    };
    const r = checkStoreDeliverability(29.5, 78.5, withArea);
    expect(r.deliverable).toBe(true);
  });
});

describe('trafficSpeedFactor', () => {
  it('slows during morning and evening rush, normal off-peak', () => {
    const at = (h: number) => trafficSpeedFactor(new Date(2026, 0, 1, h, 0, 0));
    expect(at(9)).toBeLessThan(1); // morning rush
    expect(at(18)).toBeLessThan(1); // evening rush
    expect(at(3)).toBe(1); // dead of night
  });
});

describe('estimateDeliveryEtaMins', () => {
  it('adds prep time to travel time', () => {
    const mins = estimateDeliveryEtaMins(5, 10, 25, 1);
    expect(mins).toBeGreaterThan(10);
  });

  it('returns prep time (or null) for a non-positive distance', () => {
    expect(estimateDeliveryEtaMins(0, 8)).toBe(8);
    expect(estimateDeliveryEtaMins(0, 0)).toBeNull();
  });
});
