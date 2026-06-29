"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSIGNMENT_OFFER_SECONDS = exports.MAX_ACTIVE_DELIVERIES = void 0;
exports.unassignedOrderWhere = unassignedOrderWhere;
exports.haversineKm = haversineKm;
exports.minutesSince = minutesSince;
exports.isActiveDeliveryStatus = isActiveDeliveryStatus;
exports.activeDeliveryStatuses = activeDeliveryStatuses;
exports.scoreRider = scoreRider;
const client_1 = require("@prisma/client");
exports.MAX_ACTIVE_DELIVERIES = 1;
exports.ASSIGNMENT_OFFER_SECONDS = 30;
const ACTIVE_DELIVERY_STATUSES = [
    client_1.DeliveryStatus.ASSIGNED,
    client_1.DeliveryStatus.ACCEPTED,
    client_1.DeliveryStatus.ARRIVED_AT_STORE,
    client_1.DeliveryStatus.PICKED_UP,
    client_1.DeliveryStatus.IN_TRANSIT,
    client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER,
];
function unassignedOrderWhere() {
    return {
        status: client_1.OrderStatus.READY_FOR_PICKUP,
        OR: [{ delivery: { is: null } }, { delivery: { status: client_1.DeliveryStatus.CANCELLED } }],
    };
}
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function minutesSince(date) {
    return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
}
function isActiveDeliveryStatus(status) {
    return ACTIVE_DELIVERY_STATUSES.includes(status);
}
function activeDeliveryStatuses() {
    return [...ACTIVE_DELIVERY_STATUSES];
}
function scoreRider(input) {
    if (!input.inZone)
        return Number.POSITIVE_INFINITY;
    return input.activeDeliveries * 10_000 + input.distanceKm * 100 - input.idleMins;
}
//# sourceMappingURL=rider-assignment.util.js.map