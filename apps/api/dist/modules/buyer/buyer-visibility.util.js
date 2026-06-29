"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNLIMITED_DISCOVERY_RADIUS_KM = exports.DEFAULT_BUYER_DISCOVERY_RADIUS_KM = exports.STORE_DISCOVERY_INCLUDE = exports.PRODUCT_VISIBLE_WHERE = exports.STORE_VISIBLE_WHERE = void 0;
exports.isStoreVisible = isStoreVisible;
exports.isProductVisible = isProductVisible;
exports.canDeliverToBuyer = canDeliverToBuyer;
exports.toDeliverableStoreShape = toDeliverableStoreShape;
exports.resolveBuyerDeliveryTerms = resolveBuyerDeliveryTerms;
const client_1 = require("@prisma/client");
const delivery_coverage_util_1 = require("../../common/utils/delivery-coverage.util");
exports.STORE_VISIBLE_WHERE = {
    status: client_1.StoreStatus.APPROVED,
    isActive: true,
    deletedAt: null,
};
exports.PRODUCT_VISIBLE_WHERE = {
    isActive: true,
    deletedAt: null,
    variants: {
        some: {
            isActive: true,
            inventory: { availableQty: { gt: 0 }, status: 'ACTIVE' },
        },
    },
};
exports.STORE_DISCOVERY_INCLUDE = {
    hours: true,
    storeServiceAreas: {
        include: {
            serviceArea: {
                select: { centerLat: true, centerLng: true, radiusKm: true },
            },
        },
    },
    deliveryAreas: {
        where: { isActive: true },
        select: {
            pincode: true,
            isActive: true,
            deliveryFee: true,
            minimumOrder: true,
            estimatedMinutes: true,
            priority: true,
        },
    },
};
exports.DEFAULT_BUYER_DISCOVERY_RADIUS_KM = 20;
exports.UNLIMITED_DISCOVERY_RADIUS_KM = Number.POSITIVE_INFINITY;
function isStoreVisible(store) {
    return (store.status === client_1.StoreStatus.APPROVED &&
        store.isActive &&
        store.deletedAt == null);
}
function isProductVisible(product, hasInStockVariant) {
    return product.isActive && product.deletedAt == null && hasInStockVariant;
}
function canDeliverToBuyer(store, ctx) {
    const deliverable = (0, delivery_coverage_util_1.checkStoreDeliverabilityWithCoverage)(ctx.lat, ctx.lng, store, {
        buyerPincode: ctx.pincode,
    });
    if (!deliverable.deliverable) {
        return {
            eligible: false,
            deliverable,
            pincodeMatch: false,
            filterReason: deliverable.reason ?? 'Not deliverable',
        };
    }
    const pincodeMatch = ctx.pincode
        ? Boolean((0, delivery_coverage_util_1.findActiveDeliveryArea)(store.deliveryAreas, ctx.pincode))
        : false;
    const discoveryRadiusKm = ctx.discoveryRadiusKm ?? 5;
    if (!pincodeMatch &&
        deliverable.distanceKm != null &&
        deliverable.distanceKm > discoveryRadiusKm) {
        return {
            eligible: false,
            deliverable,
            pincodeMatch,
            filterReason: `Outside discovery radius (${deliverable.distanceKm} km > ${discoveryRadiusKm} km)`,
        };
    }
    return { eligible: true, deliverable, pincodeMatch };
}
function toDeliverableStoreShape(store) {
    return {
        latitude: store.latitude,
        longitude: store.longitude,
        deliveryRadiusKm: store.deliveryRadiusKm ?? 5,
        storeServiceAreas: store.storeServiceAreas ?? [],
        deliveryAreas: store.deliveryAreas,
        deliveryFee: store.deliveryFee,
        minOrderAmount: store.minOrderAmount,
        avgPrepTimeMins: store.avgPrepTimeMins,
    };
}
function resolveBuyerDeliveryTerms(store, pincode) {
    return (0, delivery_coverage_util_1.resolveDeliveryTerms)(store, pincode);
}
//# sourceMappingURL=buyer-visibility.util.js.map