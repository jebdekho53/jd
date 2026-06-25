import {
  computeDeliveryEta,
  isValidCoordinate,
  safeDistanceKm,
  minutesAtSpeedKm,
  MAX_DELIVERY_DISTANCE_KM,
} from './delivery-eta.util';

describe('delivery-eta.util', () => {
  const store = { lat: 28.6139, lng: 77.209 };
  const customer = { lat: 28.62, lng: 77.22 };
  const rider = { lat: 28.61, lng: 77.2 };

  it('rejects null coordinates', () => {
    expect(isValidCoordinate(null, 77)).toBe(false);
    expect(isValidCoordinate(0, 0)).toBe(false);
  });

  it('rejects distance over 100km', () => {
    expect(safeDistanceKm(28.61, 77.2, 19.076, 72.877)).toBeNull();
  });

  it('returns null ETA before rider location at RIDER_ASSIGNED', () => {
    const result = computeDeliveryEta({
      orderStatus: 'RIDER_ASSIGNED',
      hasActiveAssignment: true,
      storeLat: store.lat,
      storeLng: store.lng,
      customerLat: customer.lat,
      customerLng: customer.lng,
      riderLat: null,
      riderLng: null,
    });
    expect(result.estimatedMins).toBeNull();
    expect(result.etaAvailable).toBe(false);
  });

  it('computes rider→store + store→customer ETA when assigned', () => {
    const result = computeDeliveryEta({
      orderStatus: 'RIDER_ASSIGNED',
      hasActiveAssignment: true,
      storeLat: store.lat,
      storeLng: store.lng,
      customerLat: customer.lat,
      customerLng: customer.lng,
      riderLat: rider.lat,
      riderLng: rider.lng,
    });
    expect(result.etaAvailable).toBe(true);
    expect(result.estimatedMins).toBeGreaterThan(0);
    expect(result.estimatedMins!).toBeLessThan(60);
    expect(result.liveTrackingAvailable).toBe(true);
  });

  it('rejects absurd ETA from zero coordinates', () => {
    const badKm = safeDistanceKm(0, 0, customer.lat, customer.lng);
    expect(badKm).toBeNull();
    const result = computeDeliveryEta({
      orderStatus: 'RIDER_ASSIGNED',
      hasActiveAssignment: true,
      storeLat: 0,
      storeLng: 0,
      customerLat: customer.lat,
      customerLng: customer.lng,
      riderLat: rider.lat,
      riderLng: rider.lng,
    });
    expect(result.estimatedMins).toBeNull();
  });

  it('uses 25 km/h speed', () => {
    expect(minutesAtSpeedKm(25)).toBe(60);
    expect(minutesAtSpeedKm(MAX_DELIVERY_DISTANCE_KM)).toBe(240);
  });
});
