-- Merchant Settlement System

CREATE TYPE "SettlementLedgerStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'SETTLED', 'PAID_OUT', 'REVERSED');
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');
CREATE TYPE "PayoutTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE "SettlementConfigScope" AS ENUM ('GLOBAL', 'MERCHANT', 'CATEGORY');

CREATE TABLE "merchant_wallets" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "available_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_paid_out" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settlement_ledger" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "delivery_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "platform_commission" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "commission_percent" DECIMAL(5,2) NOT NULL,
    "status" "SettlementLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "eligible_at" TIMESTAMP(3) NOT NULL,
    "settled_at" TIMESTAMP(3),
    "payout_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_ledger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "bank_details_snapshot" JSONB NOT NULL,
    "rejection_reason" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payout_transactions" (
    "id" TEXT NOT NULL,
    "payout_request_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reference_id" TEXT,
    "failure_reason" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settlement_configs" (
    "id" TEXT NOT NULL,
    "scope" "SettlementConfigScope" NOT NULL,
    "merchant_profile_id" TEXT,
    "category_id" TEXT,
    "commission_percent" DECIMAL(5,2) NOT NULL,
    "settlement_delay_days" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "merchant_wallets_merchant_profile_id_key" ON "merchant_wallets"("merchant_profile_id");
CREATE UNIQUE INDEX "settlement_ledger_order_id_key" ON "settlement_ledger"("order_id");
CREATE INDEX "settlement_ledger_merchant_profile_id_status_idx" ON "settlement_ledger"("merchant_profile_id", "status");
CREATE INDEX "settlement_ledger_status_eligible_at_idx" ON "settlement_ledger"("status", "eligible_at");
CREATE INDEX "settlement_ledger_created_at_idx" ON "settlement_ledger"("created_at" DESC);
CREATE INDEX "payout_requests_merchant_profile_id_status_idx" ON "payout_requests"("merchant_profile_id", "status");
CREATE INDEX "payout_requests_status_requested_at_idx" ON "payout_requests"("status", "requested_at");
CREATE INDEX "payout_transactions_payout_request_id_idx" ON "payout_transactions"("payout_request_id");
CREATE INDEX "settlement_configs_scope_is_active_idx" ON "settlement_configs"("scope", "is_active");
CREATE INDEX "settlement_configs_merchant_profile_id_idx" ON "settlement_configs"("merchant_profile_id");
CREATE INDEX "settlement_configs_category_id_idx" ON "settlement_configs"("category_id");

ALTER TABLE "merchant_wallets" ADD CONSTRAINT "merchant_wallets_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_ledger" ADD CONSTRAINT "settlement_ledger_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_ledger" ADD CONSTRAINT "settlement_ledger_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_ledger" ADD CONSTRAINT "settlement_ledger_payout_request_id_fkey" FOREIGN KEY ("payout_request_id") REFERENCES "payout_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_payout_request_id_fkey" FOREIGN KEY ("payout_request_id") REFERENCES "payout_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_configs" ADD CONSTRAINT "settlement_configs_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_configs" ADD CONSTRAINT "settlement_configs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default global commission: 15%, T+2 settlement
INSERT INTO "settlement_configs" ("id", "scope", "commission_percent", "settlement_delay_days", "is_active", "created_at", "updated_at")
VALUES ('settlement_global_default', 'GLOBAL', 15.00, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
