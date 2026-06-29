"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MERCHANT_BLOCKED_MESSAGE = exports.BLACKLIST_REJECTION_TYPES = exports.REVOCABLE_REJECTION_TYPES = void 0;
exports.isRevocableRejection = isRevocableRejection;
exports.isBlacklistRejection = isBlacklistRejection;
const client_1 = require("@prisma/client");
exports.REVOCABLE_REJECTION_TYPES = [
    client_1.RejectionType.DOCUMENT_ISSUE,
    client_1.RejectionType.COMPLIANCE_ISSUE,
];
exports.BLACKLIST_REJECTION_TYPES = [
    client_1.RejectionType.FRAUD,
    client_1.RejectionType.DUPLICATE_ACCOUNT,
    client_1.RejectionType.POLICY_VIOLATION,
];
function isRevocableRejection(type) {
    return type != null && exports.REVOCABLE_REJECTION_TYPES.includes(type);
}
function isBlacklistRejection(type) {
    return exports.BLACKLIST_REJECTION_TYPES.includes(type);
}
exports.MERCHANT_BLOCKED_MESSAGE = 'This merchant account has been permanently blocked.';
//# sourceMappingURL=rejection.constants.js.map