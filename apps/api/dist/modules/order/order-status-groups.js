"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MERCHANT_STATUS_GROUPS = exports.BUYER_STATUS_GROUPS = void 0;
const client_1 = require("@prisma/client");
const merchant_pipeline_util_1 = require("./merchant-pipeline.util");
exports.BUYER_STATUS_GROUPS = {
    active: [
        client_1.OrderStatus.PAYMENT_PENDING,
        client_1.OrderStatus.PAID,
        client_1.OrderStatus.CREATED,
        client_1.OrderStatus.MERCHANT_ACCEPTED,
        client_1.OrderStatus.PREPARING,
        client_1.OrderStatus.PACKING,
        client_1.OrderStatus.READY_FOR_PICKUP,
        client_1.OrderStatus.RIDER_ASSIGNED,
        client_1.OrderStatus.PICKED_UP,
        client_1.OrderStatus.OUT_FOR_DELIVERY,
    ],
    cancelled: [
        client_1.OrderStatus.CANCELLED_BY_BUYER,
        client_1.OrderStatus.CANCELLED_BY_MERCHANT,
        client_1.OrderStatus.CANCELLED_BY_ADMIN,
        client_1.OrderStatus.PAYMENT_FAILED,
        client_1.OrderStatus.DELIVERY_FAILED,
        client_1.OrderStatus.EXPIRED,
    ],
    completed: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED, client_1.OrderStatus.REFUNDED],
};
exports.MERCHANT_STATUS_GROUPS = {
    active: merchant_pipeline_util_1.MERCHANT_ACTIVE_LIVE_STATUSES,
    new: [client_1.OrderStatus.PAID, client_1.OrderStatus.MERCHANT_ACCEPTED],
    accepted: [client_1.OrderStatus.MERCHANT_ACCEPTED],
    preparing: [client_1.OrderStatus.PREPARING],
    packing: [client_1.OrderStatus.PACKING],
    ready_for_pickup: [client_1.OrderStatus.READY_FOR_PICKUP],
    rider_assigned: [client_1.OrderStatus.RIDER_ASSIGNED, client_1.OrderStatus.PICKED_UP, client_1.OrderStatus.OUT_FOR_DELIVERY],
    delivered: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED],
    cancelled: [
        client_1.OrderStatus.CANCELLED_BY_BUYER,
        client_1.OrderStatus.CANCELLED_BY_MERCHANT,
        client_1.OrderStatus.CANCELLED_BY_ADMIN,
        client_1.OrderStatus.PAYMENT_FAILED,
        client_1.OrderStatus.DELIVERY_FAILED,
    ],
};
//# sourceMappingURL=order-status-groups.js.map