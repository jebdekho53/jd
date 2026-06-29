export interface RouteStop {
    orderId: string;
    lat: number;
    lng: number;
    type: 'pickup' | 'drop';
}
export interface RouteOptimizationResult {
    distanceKm: number;
    estimatedMinutes: number;
    optimized: boolean;
    sequence: RouteStop[];
}
export declare function optimizeRoute(stops: RouteStop[], start: {
    lat: number;
    lng: number;
}): RouteOptimizationResult;
