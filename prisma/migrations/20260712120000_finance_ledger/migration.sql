-- P5.1 Finance, Settlement, Commission & Payout Engine

CREATE TYPE "LedgerAccountKind" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE "LedgerReferenceType" AS ENUM (
  'ORDER_PAYMENT', 'MERCHANT_SETTLEMENT', 'MERCHANT_PAYOUT', 'RIDER_PAYOUT',
  'REFUND', 'WALLET_CREDIT', 'COD_COLLECTION', 'COD_REMITTANCE',
  'PROMOTION_EXPENSE', 'TAX_ACCRUAL', 'ADJUSTMENT'
);
CREATE TYPE "CommissionRuleScope" AS ENUM ('GLOBAL', 'CATEGORY', 'STORE', 'CAMPAIGN');
CREATE TYPE "SettlementCycle" AS ENUM ('DAILY', 'WEEKLY', 'MANUAL');
CREATE TYPE "SettlementBatchStatus" AS ENUM ('DRAFT', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "MerchantPayoutRecordStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');
CREATE TYPE "RiderPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE "CodReconciliationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');
CREATE TYPE "FinanceAlertType" AS ENUM ('SETTLEMENT_FAILURE', 'NEGATIVE_MERCHANT_BALANCE', 'COD_MISMATCH', 'HIGH_REFUND_RATE', 'TAX_ANOMALY');
CREATE TYPE "FinanceAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "FinanceAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE "ledger_accounts" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "LedgerAccountKind" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ledger_journals" (
  "id" TEXT NOT NULL,
  "reference_type" "LedgerReferenceType" NOT NULL,
  "reference_id" TEXT NOT NULL,
  "order_id" TEXT,
  "description" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_journals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "journal_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_rules" (
  "id" TEXT NOT NULL,
  "scope" "CommissionRuleScope" NOT NULL,
  "store_id" TEXT,
  "category_id" TEXT,
  "campaign_id" TEXT,
  "commission_percent" DECIMAL(5,2) NOT NULL,
  "settlement_delay_days" INTEGER NOT NULL DEFAULT 2,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_financial_snapshots" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "offer_subsidy" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "merchant_contribution" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "platform_contribution" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "delivery_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "commission_percent" DECIMAL(5,2) NOT NULL,
  "commission_amount" DECIMAL(12,2) NOT NULL,
  "net_merchant_earnings" DECIMAL(12,2) NOT NULL,
  "net_platform_earnings" DECIMAL(12,2) NOT NULL,
  "rider_payout_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "commission_rule_id" TEXT,
  "store_snapshot" JSONB NOT NULL,
  "frozen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_financial_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settlements" (
  "id" TEXT NOT NULL,
  "merchant_profile_id" TEXT NOT NULL,
  "cycle" "SettlementCycle" NOT NULL,
  "status" "SettlementBatchStatus" NOT NULL DEFAULT 'PENDING',
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "gross_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "commission_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "refund_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "wallet_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "net_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "item_count" INTEGER NOT NULL DEFAULT 0,
  "processed_at" TIMESTAMP(3),
  "failure_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settlement_items" (
  "id" TEXT NOT NULL,
  "settlement_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "settlement_ledger_id" TEXT,
  "gross_amount" DECIMAL(12,2) NOT NULL,
  "commission_amount" DECIMAL(12,2) NOT NULL,
  "net_amount" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "settlement_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "merchant_payouts" (
  "id" TEXT NOT NULL,
  "merchant_profile_id" TEXT NOT NULL,
  "settlement_id" TEXT,
  "payout_request_id" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "MerchantPayoutRecordStatus" NOT NULL DEFAULT 'PENDING',
  "reference_id" TEXT,
  "bank_snapshot" JSONB,
  "processed_at" TIMESTAMP(3),
  "processed_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "merchant_payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rider_payouts" (
  "id" TEXT NOT NULL,
  "rider_profile_id" TEXT NOT NULL,
  "status" "RiderPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "base_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "distance_bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "peak_bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "rain_bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "incentives" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "cancellation_comp" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(12,2) NOT NULL,
  "reference_id" TEXT,
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rider_payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rider_payout_items" (
  "id" TEXT NOT NULL,
  "rider_payout_id" TEXT NOT NULL,
  "delivery_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rider_payout_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_records" (
  "id" TEXT NOT NULL,
  "order_id" TEXT,
  "settlement_id" TEXT,
  "merchant_profile_id" TEXT,
  "tax_type" TEXT NOT NULL,
  "taxable_amount" DECIMAL(12,2) NOT NULL,
  "tax_amount" DECIMAL(12,2) NOT NULL,
  "gst_rate" DECIMAL(5,2),
  "period_month" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tax_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cod_reconciliations" (
  "id" TEXT NOT NULL,
  "rider_profile_id" TEXT NOT NULL,
  "order_id" TEXT,
  "amount_expected" DECIMAL(12,2) NOT NULL,
  "amount_collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "amount_deposited" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "mismatch_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "status" "CodReconciliationStatus" NOT NULL DEFAULT 'PENDING',
  "submitted_at" TIMESTAMP(3),
  "verified_at" TIMESTAMP(3),
  "verified_by" TEXT,
  "rejection_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cod_reconciliations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_alerts" (
  "id" TEXT NOT NULL,
  "alert_type" "FinanceAlertType" NOT NULL,
  "severity" "FinanceAlertSeverity" NOT NULL,
  "status" "FinanceAlertStatus" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "finance_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "ledger_accounts"("code");
CREATE UNIQUE INDEX "ledger_journals_idempotency_key_key" ON "ledger_journals"("idempotency_key");
CREATE UNIQUE INDEX "order_financial_snapshots_order_id_key" ON "order_financial_snapshots"("order_id");
CREATE UNIQUE INDEX "settlement_items_settlement_id_order_id_key" ON "settlement_items"("settlement_id", "order_id");
CREATE UNIQUE INDEX "merchant_payouts_payout_request_id_key" ON "merchant_payouts"("payout_request_id");
CREATE UNIQUE INDEX "rider_payout_items_rider_payout_id_delivery_id_key" ON "rider_payout_items"("rider_payout_id", "delivery_id");

CREATE INDEX "ledger_journals_reference_type_reference_id_idx" ON "ledger_journals"("reference_type", "reference_id");
CREATE INDEX "ledger_journals_order_id_idx" ON "ledger_journals"("order_id");
CREATE INDEX "ledger_journals_created_at_idx" ON "ledger_journals"("created_at" DESC);
CREATE INDEX "ledger_entries_journal_id_idx" ON "ledger_entries"("journal_id");
CREATE INDEX "ledger_entries_account_id_idx" ON "ledger_entries"("account_id");
CREATE INDEX "commission_rules_scope_is_active_idx" ON "commission_rules"("scope", "is_active");
CREATE INDEX "settlements_merchant_profile_id_status_idx" ON "settlements"("merchant_profile_id", "status");
CREATE INDEX "cod_reconciliations_rider_profile_id_status_idx" ON "cod_reconciliations"("rider_profile_id", "status");
CREATE INDEX "finance_alerts_status_severity_idx" ON "finance_alerts"("status", "severity");

ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "ledger_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_financial_snapshots" ADD CONSTRAINT "order_financial_snapshots_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_ledger_id_fkey" FOREIGN KEY ("settlement_ledger_id") REFERENCES "settlement_ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchant_payouts" ADD CONSTRAINT "merchant_payouts_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "merchant_payouts" ADD CONSTRAINT "merchant_payouts_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchant_payouts" ADD CONSTRAINT "merchant_payouts_payout_request_id_fkey" FOREIGN KEY ("payout_request_id") REFERENCES "payout_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rider_payouts" ADD CONSTRAINT "rider_payouts_rider_profile_id_fkey" FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rider_payout_items" ADD CONSTRAINT "rider_payout_items_rider_payout_id_fkey" FOREIGN KEY ("rider_payout_id") REFERENCES "rider_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rider_payout_items" ADD CONSTRAINT "rider_payout_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cod_reconciliations" ADD CONSTRAINT "cod_reconciliations_rider_profile_id_fkey" FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cod_reconciliations" ADD CONSTRAINT "cod_reconciliations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed chart of accounts
INSERT INTO "ledger_accounts" ("id", "code", "name", "kind") VALUES
  ('acct_customer', 'CUSTOMER_RECEIVABLE', 'Customer Receivable', 'ASSET'),
  ('acct_escrow', 'PLATFORM_ESCROW', 'Platform Escrow', 'LIABILITY'),
  ('acct_merchant', 'MERCHANT_PAYABLE', 'Merchant Payable', 'LIABILITY'),
  ('acct_rider', 'RIDER_PAYABLE', 'Rider Payable', 'LIABILITY'),
  ('acct_wallet', 'WALLET_LIABILITY', 'Wallet Liability', 'LIABILITY'),
  ('acct_refund', 'REFUND_EXPENSE', 'Refund Expense', 'EXPENSE'),
  ('acct_promo', 'PROMOTION_EXPENSE', 'Promotion Expense', 'EXPENSE'),
  ('acct_commission', 'PLATFORM_COMMISSION', 'Platform Commission Revenue', 'REVENUE'),
  ('acct_delivery', 'DELIVERY_REVENUE', 'Delivery Revenue', 'REVENUE'),
  ('acct_gst', 'GST_PAYABLE', 'GST Payable', 'LIABILITY'),
  ('acct_cod', 'COD_COLLECTED', 'COD Collected', 'ASSET');
