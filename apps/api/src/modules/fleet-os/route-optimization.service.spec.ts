import { optimizeRoute } from './route-optimization.util';

describe('RouteOptimizationService', () => {
  it('optimizes multi-stop route with distance and time', () => {
    const stops = [
      { orderId: 'o1', lat: 28.61, lng: 77.21, type: 'pickup' as const },
      { orderId: 'o1', lat: 28.62, lng: 77.22, type: 'drop' as const },
      { orderId: 'o2', lat: 28.61, lng: 77.21, type: 'pickup' as const },
      { orderId: 'o2', lat: 28.63, lng: 77.23, type: 'drop' as const },
    ];
    const result = optimizeRoute(stops, { lat: 28.6, lng: 77.2 });
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.estimatedMinutes).toBeGreaterThan(0);
    expect(result.optimized).toBe(true);
    expect(result.sequence).toHaveLength(4);
  });

  it('returns empty route for no stops', () => {
    const result = optimizeRoute([], { lat: 0, lng: 0 });
    expect(result.distanceKm).toBe(0);
    expect(result.sequence).toHaveLength(0);
  });
});
