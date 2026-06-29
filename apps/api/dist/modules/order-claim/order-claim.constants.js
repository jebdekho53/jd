"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPLACEMENT_DISPATCH_FAILED = exports.MAX_CLAIM_EVIDENCE_ITEMS = exports.FULFILLMENT_CLAIM_ACTIONS = exports.TERMINAL_FULFILLMENT_CLAIM_STATUSES = exports.INACTIVE_CLAIM_STATUSES = void 0;
const client_1 = require("@prisma/client");
exports.INACTIVE_CLAIM_STATUSES = [
    client_1.OrderClaimStatus.REJECTED,
    client_1.OrderClaimStatus.CLOSED,
];
exports.TERMINAL_FULFILLMENT_CLAIM_STATUSES = [
    client_1.OrderClaimStatus.REFUND_PROCESSED,
    client_1.OrderClaimStatus.REJECTED,
    client_1.OrderClaimStatus.CLOSED,
    client_1.OrderClaimStatus.REPLACEMENT_SHIPPED,
];
exports.FULFILLMENT_CLAIM_ACTIONS = new Set([
    'APPROVE',
    'APPROVE_REFUND',
    'APPROVE_REPLACEMENT',
    'ISSUE_REPLACEMENT',
]);
exports.MAX_CLAIM_EVIDENCE_ITEMS = 5;
exports.REPLACEMENT_DISPATCH_FAILED = 'DISPATCH_FAILED';
//# sourceMappingURL=order-claim.constants.js.map