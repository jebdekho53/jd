"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLA_THRESHOLDS = exports.PIPELINE_COLUMN_STATUSES = void 0;
exports.resolvePipelineColumn = resolvePipelineColumn;
exports.slaLevel = slaLevel;
exports.minutesSince = minutesSince;
const client_1 = require("@prisma/client");
const CANCELLED = new Set([
    client_1.OrderStatus.CANCELLED_BY_BUYER,
    client_1.OrderStatus.CANCELLED_BY_MERCHANT,
    client_1.OrderStatus.CANCELLED_BY_ADMIN,
    client_1.OrderStatus.PAYMENT_FAILED,
    client_1.OrderStatus.DELIVERY_FAILED,
]);
exports.PIPELINE_COLUMN_STATUSES = {
    NEW: [client_1.OrderStatus.PAID, client_1.OrderStatus.MERCHANT_ACCEPTED],
    ACCEPTED: [client_1.OrderStatus.MERCHANT_ACCEPTED],
    PREPARING: [client_1.OrderStatus.PREPARING],
    PACKING: [client_1.OrderStatus.PACKING],
    READY_FOR_PICKUP: [client_1.OrderStatus.READY_FOR_PICKUP],
    RIDER_ASSIGNED: [client_1.OrderStatus.RIDER_ASSIGNED, client_1.OrderStatus.PICKED_UP],
    OUT_FOR_DELIVERY: [client_1.OrderStatus.OUT_FOR_DELIVERY],
    DELIVERED: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED],
    CANCELLED: [...CANCELLED],
};
function resolvePipelineColumn(status, paymentMethod) {
    if (CANCELLED.has(status))
        return 'CANCELLED';
    if (status === client_1.OrderStatus.DELIVERED || status === client_1.OrderStatus.COMPLETED)
        return 'DELIVERED';
    if (status === client_1.OrderStatus.OUT_FOR_DELIVERY)
        return 'OUT_FOR_DELIVERY';
    if (status === client_1.OrderStatus.RIDER_ASSIGNED || status === client_1.OrderStatus.PICKED_UP)
        return 'RIDER_ASSIGNED';
    if (status === client_1.OrderStatus.READY_FOR_PICKUP)
        return 'READY_FOR_PICKUP';
    if (status === client_1.OrderStatus.PACKING)
        return 'PACKING';
    if (status === client_1.OrderStatus.PREPARING)
        return 'PREPARING';
    if (status === client_1.OrderStatus.MERCHANT_ACCEPTED) {
        return paymentMethod === client_1.PaymentMethod.COD ? 'NEW' : 'ACCEPTED';
    }
    return 'NEW';
}
exports.SLA_THRESHOLDS = {
    accept: { yellow: 5, red: 10 },
    prepare: { yellow: 15, red: 25 },
    pack: { yellow: 8, red: 15 },
    riderWait: { yellow: 10, red: 20 },
};
function slaLevel(elapsedMins, yellow, red) {
    if (elapsedMins >= red)
        return 'red';
    if (elapsedMins >= yellow)
        return 'yellow';
    return 'green';
}
function minutesSince(date) {
    if (!date)
        return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
}
//# sourceMappingURL=merchant-pipeline.util.js.map