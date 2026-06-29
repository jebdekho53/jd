"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeRoute = optimizeRoute;
function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function optimizeRoute(stops, start) {
    if (stops.length === 0) {
        return { distanceKm: 0, estimatedMinutes: 0, optimized: true, sequence: [] };
    }
    const pickups = stops.filter((s) => s.type === 'pickup');
    const drops = stops.filter((s) => s.type === 'drop');
    const ordered = [];
    let current = start;
    let totalKm = 0;
    const visitNearest = (pool) => {
        while (pool.length > 0) {
            let bestIdx = 0;
            let bestDist = Infinity;
            for (let i = 0; i < pool.length; i++) {
                const d = haversineKm(current, pool[i]);
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }
            const next = pool.splice(bestIdx, 1)[0];
            totalKm += bestDist;
            current = next;
            ordered.push(next);
        }
    };
    visitNearest([...pickups]);
    visitNearest([...drops]);
    const estimatedMinutes = Math.ceil((totalKm / 20) * 60 + ordered.length * 5);
    return {
        distanceKm: Math.round(totalKm * 100) / 100,
        estimatedMinutes,
        optimized: stops.length > 1,
        sequence: ordered,
    };
}
//# sourceMappingURL=route-optimization.util.js.map