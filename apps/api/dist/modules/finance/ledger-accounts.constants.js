"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEDGER_ACCOUNT_DEFINITIONS = exports.LEDGER_ACCOUNT_CODES = void 0;
exports.LEDGER_ACCOUNT_CODES = {
    CUSTOMER_RECEIVABLE: 'CUSTOMER_RECEIVABLE',
    PLATFORM_ESCROW: 'PLATFORM_ESCROW',
    MERCHANT_PAYABLE: 'MERCHANT_PAYABLE',
    RIDER_PAYABLE: 'RIDER_PAYABLE',
    WALLET_LIABILITY: 'WALLET_LIABILITY',
    REFUND_EXPENSE: 'REFUND_EXPENSE',
    PROMOTION_EXPENSE: 'PROMOTION_EXPENSE',
    PLATFORM_COMMISSION: 'PLATFORM_COMMISSION',
    DELIVERY_REVENUE: 'DELIVERY_REVENUE',
    GST_PAYABLE: 'GST_PAYABLE',
    COD_COLLECTED: 'COD_COLLECTED',
};
exports.LEDGER_ACCOUNT_DEFINITIONS = [
    { code: exports.LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, name: 'Customer Receivable', kind: 'ASSET' },
    { code: exports.LEDGER_ACCOUNT_CODES.COD_COLLECTED, name: 'COD Cash Collected', kind: 'ASSET' },
    { code: exports.LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, name: 'Platform Escrow', kind: 'LIABILITY' },
    { code: exports.LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, name: 'Merchant Payable', kind: 'LIABILITY' },
    { code: exports.LEDGER_ACCOUNT_CODES.RIDER_PAYABLE, name: 'Rider Payable', kind: 'LIABILITY' },
    { code: exports.LEDGER_ACCOUNT_CODES.WALLET_LIABILITY, name: 'Wallet Liability', kind: 'LIABILITY' },
    { code: exports.LEDGER_ACCOUNT_CODES.GST_PAYABLE, name: 'GST Payable', kind: 'LIABILITY' },
    { code: exports.LEDGER_ACCOUNT_CODES.REFUND_EXPENSE, name: 'Refund Expense', kind: 'EXPENSE' },
    { code: exports.LEDGER_ACCOUNT_CODES.PROMOTION_EXPENSE, name: 'Promotion Expense', kind: 'EXPENSE' },
    { code: exports.LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, name: 'Platform Commission', kind: 'REVENUE' },
    { code: exports.LEDGER_ACCOUNT_CODES.DELIVERY_REVENUE, name: 'Delivery Revenue', kind: 'REVENUE' },
];
//# sourceMappingURL=ledger-accounts.constants.js.map