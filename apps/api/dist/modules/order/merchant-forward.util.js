"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOOD_MERCHANT_FORWARD = exports.GROCERY_MERCHANT_FORWARD = void 0;
exports.merchantForwardMap = merchantForwardMap;
const client_1 = require("@prisma/client");
exports.GROCERY_MERCHANT_FORWARD = {
    [client_1.OrderStatus.CREATED]: client_1.OrderStatus.MERCHANT_ACCEPTED,
    [client_1.OrderStatus.PAID]: client_1.OrderStatus.MERCHANT_ACCEPTED,
    [client_1.OrderStatus.MERCHANT_ACCEPTED]: client_1.OrderStatus.PREPARING,
    [client_1.OrderStatus.PREPARING]: client_1.OrderStatus.PACKING,
    [client_1.OrderStatus.PACKING]: client_1.OrderStatus.READY_FOR_PICKUP,
};
exports.FOOD_MERCHANT_FORWARD = {
    [client_1.OrderStatus.PAID]: client_1.OrderStatus.MERCHANT_ACCEPTED,
    [client_1.OrderStatus.MERCHANT_ACCEPTED]: client_1.OrderStatus.PREPARING,
    [client_1.OrderStatus.PREPARING]: client_1.OrderStatus.READY_FOR_PICKUP,
};
function merchantForwardMap(vertical) {
    return vertical === client_1.OrderVertical.FOOD ? exports.FOOD_MERCHANT_FORWARD : exports.GROCERY_MERCHANT_FORWARD;
}
//# sourceMappingURL=merchant-forward.util.js.map