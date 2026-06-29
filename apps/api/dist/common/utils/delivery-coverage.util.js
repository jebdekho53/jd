"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveDeliveryAreas = hasActiveDeliveryAreas;
exports.findActiveDeliveryArea = findActiveDeliveryArea;
exports.storeServesPincode = storeServesPincode;
exports.resolveDeliveryTerms = resolveDeliveryTerms;
exports.checkStoreDeliverabilityWithCoverage = checkStoreDeliverabilityWithCoverage;
const geospatial_util_1 = require("./geospatial.util");
function hasActiveDeliveryAreas(areas) {
    return Boolean(areas?.some((a) => a.isActive));
}
function findActiveDeliveryArea(areas, pincode) {
    if (!areas?.length || !pincode)
        return null;
    const matches = areas.filter((a) => a.isActive && a.pincode === pincode);
    if (matches.length === 0)
        return null;
    return matches.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ?? null;
}
function storeServesPincode(store, buyerPincode) {
    const area = findActiveDeliveryArea(store.deliveryAreas, buyerPincode);
    return area != null;
}
function resolveDeliveryTerms(store, buyerPincode) {
    const area = buyerPincode ? findActiveDeliveryArea(store.deliveryAreas, buyerPincode) : null;
    const toNum = (v, fallback) => {
        if (v == null)
            return fallback;
        return typeof v === 'number' ? v : Number(v);
    };
    return {
        deliveryFee: toNum(area?.deliveryFee, toNum(store.deliveryFee, 0)),
        minOrderAmount: toNum(area?.minimumOrder, toNum(store.minOrderAmount, 0)),
        estimatedMinutes: area?.estimatedMinutes ?? store.avgPrepTimeMins ?? 15,
    };
}
function checkStoreDeliverabilityWithCoverage(buyerLat, buyerLng, store, options) {
    const buyerPincode = options?.buyerPincode?.trim();
    if (buyerPincode && hasActiveDeliveryAreas(store.deliveryAreas)) {
        const area = findActiveDeliveryArea(store.deliveryAreas, buyerPincode);
        if (!area) {
            return {
                deliverable: false,
                distanceKm: null,
                effectiveRadiusKm: store.deliveryRadiusKm ?? 5,
                reason: 'Store does not deliver to this pincode',
            };
        }
        const geo = (0, geospatial_util_1.checkStoreDeliverability)(buyerLat, buyerLng, store);
        return {
            deliverable: true,
            distanceKm: geo.distanceKm,
            effectiveRadiusKm: geo.effectiveRadiusKm,
        };
    }
    return (0, geospatial_util_1.checkStoreDeliverability)(buyerLat, buyerLng, store);
}
//# sourceMappingURL=delivery-coverage.util.js.map