export const LEDGER_ACCOUNT_CODES = {
  CUSTOMER_RECEIVABLE: 'CUSTOMER_RECEIVABLE',
  PLATFORM_ESCROW: 'PLATFORM_ESCROW',
  MERCHANT_PAYABLE: 'MERCHANT_PAYABLE',
  FRANCHISE_PAYABLE: 'FRANCHISE_PAYABLE',
  RIDER_PAYABLE: 'RIDER_PAYABLE',
  WALLET_LIABILITY: 'WALLET_LIABILITY',
  REFUND_EXPENSE: 'REFUND_EXPENSE',
  PROMOTION_EXPENSE: 'PROMOTION_EXPENSE',
  PLATFORM_COMMISSION: 'PLATFORM_COMMISSION',
  DELIVERY_REVENUE: 'DELIVERY_REVENUE',
  GST_PAYABLE: 'GST_PAYABLE',
  COD_COLLECTED: 'COD_COLLECTED',
} as const;

export type LedgerAccountCode = (typeof LEDGER_ACCOUNT_CODES)[keyof typeof LEDGER_ACCOUNT_CODES];

/**
 * Chart of accounts. Kept in code so the ledger self-seeds on first use — the
 * `ledger_accounts` table never has to be populated by a separate seed step.
 * `kind` drives the normal balance (ASSET/EXPENSE are debit-normal; the rest
 * credit-normal), so keep these aligned with real accounting semantics.
 */
export const LEDGER_ACCOUNT_DEFINITIONS: {
  code: LedgerAccountCode;
  name: string;
  kind: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}[] = [
  { code: LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE, name: 'Customer Receivable', kind: 'ASSET' },
  { code: LEDGER_ACCOUNT_CODES.COD_COLLECTED, name: 'COD Cash Collected', kind: 'ASSET' },
  { code: LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW, name: 'Platform Escrow', kind: 'LIABILITY' },
  { code: LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, name: 'Merchant Payable', kind: 'LIABILITY' },
  { code: LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE, name: 'Franchise Payable', kind: 'LIABILITY' },
  { code: LEDGER_ACCOUNT_CODES.RIDER_PAYABLE, name: 'Rider Payable', kind: 'LIABILITY' },
  { code: LEDGER_ACCOUNT_CODES.WALLET_LIABILITY, name: 'Wallet Liability', kind: 'LIABILITY' },
  { code: LEDGER_ACCOUNT_CODES.GST_PAYABLE, name: 'GST Payable', kind: 'LIABILITY' },
  { code: LEDGER_ACCOUNT_CODES.REFUND_EXPENSE, name: 'Refund Expense', kind: 'EXPENSE' },
  { code: LEDGER_ACCOUNT_CODES.PROMOTION_EXPENSE, name: 'Promotion Expense', kind: 'EXPENSE' },
  { code: LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, name: 'Platform Commission', kind: 'REVENUE' },
  { code: LEDGER_ACCOUNT_CODES.DELIVERY_REVENUE, name: 'Delivery Revenue', kind: 'REVENUE' },
];
