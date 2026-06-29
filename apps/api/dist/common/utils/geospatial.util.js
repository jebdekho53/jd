"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DELIVERY_RADIUS_KM = exports.ALLOWED_DELIVERY_RADII_KM = void 0;
exports.normalizeDeliveryRadiusKm = normalizeDeliveryRadiusKm;
exports.checkStoreDeliverability = checkStoreDeliverability;
exports.trafficSpeedFactor = trafficSpeedFactor;
exports.estimateDeliveryEtaMins = estimateDeliveryEtaMins;
exports.estimateStoreToBuyerEta = estimateStoreToBuyerEta;
const delivery_eta_util_1 = require("./delivery-eta.util");
exports.ALLOWED_DELIVERY_RADII_KM = [1, 3, 5, 8, 10];
exports.DEFAULT_DELIVERY_RADIUS_KM = 5;
function normalizeDeliveryRadiusKm(value) {
    if (value == null || !Number.isFinite(value))
        return exports.DEFAULT_DELIVERY_RADIUS_KM;
    const allowed = exports.ALLOWED_DELIVERY_RADII_KM;
    if (allowed.includes(value))
        return value;
    return allowed.reduce((best, r) => Math.abs(r - value) < Math.abs(best - value) ? r : best);
}
function checkStoreDeliverability(buyerLat, buyerLng, store) {
    if (!(0, delivery_eta_util_1.isValidCoordinate)(buyerLat, buyerLng)) {
        return {
            deliverable: false,
            distanceKm: null,
            effectiveRadiusKm: normalizeDeliveryRadiusKm(store.deliveryRadiusKm),
            reason: 'Invalid buyer coordinates',
        };
    }
    const storeRadius = normalizeDeliveryRadiusKm(store.deliveryRadiusKm);
    const distanceToStore = (0, delivery_eta_util_1.haversineKm)(buyerLat, buyerLng, store.latitude, store.longitude);
    const nearStore = distanceToStore <= storeRadius;
    if (store.storeServiceAreas.length === 0) {
        if (!nearStore) {
            return {
                deliverable: false,
                distanceKm: Math.round(distanceToStore * 100) / 100,
                effectiveRadiusKm: storeRadius,
                reason: 'Outside store delivery radius',
            };
        }
        return {
            deliverable: true,
            distanceKm: Math.round(distanceToStore * 100) / 100,
            effectiveRadiusKm: storeRadius,
        };
    }
    const serviceDistances = store.storeServiceAreas.map(({ serviceArea: sa }) => (0, delivery_eta_util_1.haversineKm)(buyerLat, buyerLng, sa.centerLat, sa.centerLng));
    const inServiceArea = store.storeServiceAreas.some(({ serviceArea: sa }, i) => serviceDistances[i] <= sa.radiusKm);
    if (!nearStore && !inServiceArea) {
        return {
            deliverable: false,
            distanceKm: Math.round(distanceToStore * 100) / 100,
            effectiveRadiusKm: storeRadius,
            reason: 'Outside delivery zone',
        };
    }
    const effectiveDistance = nearStore ? distanceToStore : Math.min(...serviceDistances);
    return {
        deliverable: true,
        distanceKm: Math.round(effectiveDistance * 100) / 100,
        effectiveRadiusKm: storeRadius,
    };
}
function trafficSpeedFactor(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 8 && hour <= 10)
        return 0.85;
    if (hour >= 17 && hour <= 20)
        return 0.8;
    if (hour >= 12 && hour <= 14)
        return 0.9;
    return 1;
}
function estimateDeliveryEtaMins(distanceKm, prepTimeMins = 0, speedKmh = 25, trafficFactor = 1) {
    if (!Number.isFinite(distanceKm) || distanceKm <= 0)
        return prepTimeMins > 0 ? prepTimeMins : null;
    const travelMins = Math.max(1, Math.round((distanceKm / (speedKmh * trafficFactor)) * 60));
    return prepTimeMins + travelMins;
}
function estimateStoreToBuyerEta(storeLat, storeLng, buyerLat, buyerLng, prepTimeMins, maxRadiusKm) {
    const km = (0, delivery_eta_util_1.safeDistanceKm)(storeLat, storeLng, buyerLat, buyerLng);
    if (km == null || km > maxRadiusKm)
        return null;
    return estimateDeliveryEtaMins(km, prepTimeMins, 25, trafficSpeedFactor());
}
//# sourceMappingURL=geospatial.util.js.map