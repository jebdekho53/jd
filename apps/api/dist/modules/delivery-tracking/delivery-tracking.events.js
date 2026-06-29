"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACKING_EVENTS = void 0;
exports.trackingRoom = trackingRoom;
exports.orderRoom = orderRoom;
exports.TRACKING_EVENTS = {
    LOCATION_UPDATED: 'rider.location.updated',
    ORDER_LOCATION_UPDATED: 'order.location.updated',
    ETA_UPDATED: 'delivery.eta.updated',
    STARTED: 'delivery.started',
    ARRIVED: 'delivery.arrived',
    COMPLETED: 'delivery.completed',
    ORDER_STATUS: 'order.status.updated',
};
function trackingRoom(namespace, id) {
    return `${namespace}:${id}`;
}
function orderRoom(orderId) {
    return `order:${orderId}`;
}
//# sourceMappingURL=delivery-tracking.events.js.map