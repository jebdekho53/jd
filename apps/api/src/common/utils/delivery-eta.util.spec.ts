import {
  computeDeliveryEta,
  haversineKm,
  isValidCoordinate,
  minutesAtSpeedKm,
  roadDistanceKm,
  safeDistanceKm,
  MAX_DELIVERY_DISTANCE_KM,
} from './delivery-eta.util';

describe('delivery-eta geometry', () => {
  it('isValidCoordinate rejects null-island, out-of-range and non-finite', () => {
    expect(isValidCoordinate(28.61, 77.23)).toBe(true); // New Delhi
    expect(isValidCoordinate(0, 0)).toBe(false);
    expect(isValidCoordinate(91, 10)).toBe(false);
    expect(isValidCoordinate(10, 181)).toBe(false);
    expect(isValidCoordinate(NaN, 10)).toBe(false);
    expect(isValidCoordinate(null, 10)).toBe(false);
  });

  it('haversineKm matches a known distance (Delhi ↔ Gurgaon ≈ 27 km)', () => {
    const km = haversineKm(28.6139, 77.209, 28.4595, 77.0266);
    expect(km).toBeGreaterThan(23);
    expect(km).toBeLessThan(32);
  });

  it('safeDistanceKm returns null for invalid or over-max distances', () => {
    expect(safeDistanceKm(0, 0, 10, 10)).toBeNull(); // invalid origin
    // London ↔ Delhi is far over the 100km delivery cap
    expect(safeDistanceKm(51.5, -0.12, 28.61, 77.23)).toBeNull();
    const near = safeDistanceKm(28.61, 77.23, 28.62, 77.24);
    expect(near).not.toBeNull();
    expect(near!).toBeLessThan(MAX_DELIVERY_DISTANCE_KM);
  });

  it('roadDistanceKm inflates straight-line by the 1.4x road factor', () => {
    expect(roadDistanceKm(10)).toBe(14);
  });

  it('minutesAtSpeedKm clamps the traffic factor and floors at 1 minute', () => {
    // 25 km at 25 km/h with no traffic = 60 min
    expect(minutesAtSpeedKm(25, 25, 1)).toBe(60);
    // tiny distance never returns 0
    expect(minutesAtSpeedKm(0.01, 25, 1)).toBe(1);
    // extreme traffic factor is clamped to the 0.5..1.5 band, not applied raw
    expect(minutesAtSpeedKm(25, 25, 100)).toBe(minutesAtSpeedKm(25, 25, 1.5));
  });
});

describe('computeDeliveryEta state machine', () => {
  const base = {
    storeLat: 28.61,
    storeLng: 77.23,
    customerLat: 28.62,
    customerLng: 77.24,
    riderLat: 28.6,
    riderLng: 77.22,
    hasActiveAssignment: true,
  };

  it('no ETA before a rider is assigned', () => {
    const r = computeDeliveryEta({ ...base, orderStatus: 'PLACED', hasActiveAssignment: false });
    expect(r.etaAvailable).toBe(false);
    expect(r.estimatedMins).toBeNull();
    expect(r.liveTrackingAvailable).toBe(false);
  });

  it('gives an ETA and live tracking once a rider is assigned with valid coords', () => {
    const r = computeDeliveryEta({ ...base, orderStatus: 'RIDER_ASSIGNED' });
    expect(r.etaAvailable).toBe(true);
    expect(r.liveTrackingAvailable).toBe(true);
    expect(r.estimatedMins).toBeGreaterThan(0);
  });

  it('suppresses ETA when the customer is outside the delivery radius', () => {
    const r = computeDeliveryEta({
      ...base,
      orderStatus: 'RIDER_ASSIGNED',
      deliveryRadiusKm: 0.1,
    });
    expect(r.etaAvailable).toBe(false);
  });
});
