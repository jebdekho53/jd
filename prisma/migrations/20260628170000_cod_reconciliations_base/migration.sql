-- Baseline for cod_reconciliations.
-- The table + CodReconciliationStatus enum were originally created in the later
-- 20260712120000_finance_ledger migration, but the earlier
-- 20260628180000_business_integrity migration already ALTERs the table. Created
-- here so a clean `migrate deploy` replays in order; the later migration now
-- creates them idempotently.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CodReconciliationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "cod_reconciliations" (
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
