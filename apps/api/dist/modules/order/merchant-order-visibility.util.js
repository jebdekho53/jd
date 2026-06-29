"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MERCHANT_HIDDEN_STATUSES = void 0;
exports.merchantPaymentVisibilityWhere = merchantPaymentVisibilityWhere;
exports.merchantNewTabWhere = merchantNewTabWhere;
exports.merchantAcceptedTabWhere = merchantAcceptedTabWhere;
exports.merchantDefaultVisibleWhere = merchantDefaultVisibleWhere;
exports.buildMerchantListWhere = buildMerchantListWhere;
exports.isDispatchPaymentCleared = isDispatchPaymentCleared;
const client_1 = require("@prisma/client");
const order_status_groups_1 = require("./order-status-groups");
const merchant_pipeline_util_1 = require("./merchant-pipeline.util");
const COD_METHODS = [client_1.PaymentMethod.COD, client_1.PaymentMethod.WALLET_COD];
const CANCELLED_STATUSES = [
    client_1.OrderStatus.CANCELLED_BY_BUYER,
    client_1.OrderStatus.CANCELLED_BY_MERCHANT,
    client_1.OrderStatus.CANCELLED_BY_ADMIN,
    client_1.OrderStatus.PAYMENT_FAILED,
    client_1.OrderStatus.DELIVERY_FAILED,
];
exports.MERCHANT_HIDDEN_STATUSES = [
    client_1.OrderStatus.CREATED,
    client_1.OrderStatus.PAYMENT_PENDING,
    client_1.OrderStatus.REFUNDED,
    ...CANCELLED_STATUSES,
];
function merchantPaymentVisibilityWhere() {
    return {
        OR: [
            { paymentMethod: { in: COD_METHODS } },
            { paymentStatus: client_1.PaymentStatus.PAID },
        ],
    };
}
function merchantNewTabWhere() {
    return {
        AND: [
            merchantPaymentVisibilityWhere(),
            {
                OR: [
                    { status: client_1.OrderStatus.PAID },
                    {
                        status: client_1.OrderStatus.MERCHANT_ACCEPTED,
                        paymentMethod: { in: COD_METHODS },
                    },
                ],
            },
        ],
    };
}
function merchantAcceptedTabWhere() {
    return {
        AND: [
            merchantPaymentVisibilityWhere(),
            {
                status: client_1.OrderStatus.MERCHANT_ACCEPTED,
                paymentMethod: { notIn: COD_METHODS },
            },
        ],
    };
}
function merchantDefaultVisibleWhere() {
    return {
        AND: [
            { status: { notIn: exports.MERCHANT_HIDDEN_STATUSES } },
            merchantPaymentVisibilityWhere(),
        ],
    };
}
function pipelineColumnWhere(column) {
    if (column === 'NEW')
        return merchantNewTabWhere();
    if (column === 'ACCEPTED')
        return merchantAcceptedTabWhere();
    if (column === 'CANCELLED') {
        return { status: { in: CANCELLED_STATUSES } };
    }
    const statuses = merchant_pipeline_util_1.PIPELINE_COLUMN_STATUSES[column];
    return {
        AND: [
            merchantPaymentVisibilityWhere(),
            { status: { in: [...statuses] } },
        ],
    };
}
function merchantGroupWhere(group) {
    if (group === 'new')
        return merchantNewTabWhere();
    if (group === 'accepted')
        return merchantAcceptedTabWhere();
    if (group === 'cancelled') {
        return { status: { in: CANCELLED_STATUSES } };
    }
    return {
        AND: [
            merchantPaymentVisibilityWhere(),
            { status: { in: [...order_status_groups_1.MERCHANT_STATUS_GROUPS[group]] } },
        ],
    };
}
function buildMerchantListWhere(opts) {
    if (opts.status) {
        if (CANCELLED_STATUSES.includes(opts.status)) {
            return { status: opts.status };
        }
        return {
            AND: [{ status: opts.status }, merchantPaymentVisibilityWhere()],
        };
    }
    if (opts.pipelineColumn)
        return pipelineColumnWhere(opts.pipelineColumn);
    if (opts.merchantStatusGroup)
        return merchantGroupWhere(opts.merchantStatusGroup);
    return merchantDefaultVisibleWhere();
}
function isDispatchPaymentCleared(paymentMethod, paymentStatus) {
    if (COD_METHODS.includes(paymentMethod))
        return true;
    return paymentStatus === client_1.PaymentStatus.PAID;
}
//# sourceMappingURL=merchant-order-visibility.util.js.map