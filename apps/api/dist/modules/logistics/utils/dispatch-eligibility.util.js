"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOOD_DISPATCH_STATUSES = exports.GROCERY_DISPATCH_AT_PLACED_STATUSES = void 0;
exports.isDispatchEligibleOrderStatus = isDispatchEligibleOrderStatus;
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
exports.GROCERY_DISPATCH_AT_PLACED_STATUSES = new Set([
    client_1.OrderStatus.PAID,
    client_1.OrderStatus.MERCHANT_ACCEPTED,
    client_1.OrderStatus.PREPARING,
    client_1.OrderStatus.PACKING,
    client_1.OrderStatus.READY_FOR_PICKUP,
]);
exports.FOOD_DISPATCH_STATUSES = new Set([
    client_1.OrderStatus.READY_FOR_PICKUP,
]);
function isDispatchEligibleOrderStatus(status, orderVertical = client_2.OrderVertical.GROCERY) {
    if (orderVertical === client_2.OrderVertical.FOOD) {
        return exports.FOOD_DISPATCH_STATUSES.has(status);
    }
    return exports.GROCERY_DISPATCH_AT_PLACED_STATUSES.has(status);
}
//# sourceMappingURL=dispatch-eligibility.util.js.map