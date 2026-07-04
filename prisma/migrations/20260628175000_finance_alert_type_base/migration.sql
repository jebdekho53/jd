-- Baseline for FinanceAlertType enum.
-- Originally created in the later 20260712120000_finance_ledger migration, but
-- the earlier 20260628180000_business_integrity migration does
-- `ALTER TYPE "FinanceAlertType" ADD VALUE ...`. Create the base enum here so a
-- clean `migrate deploy` replays in order; finance_ledger now creates it
-- idempotently.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "FinanceAlertType" AS ENUM ('SETTLEMENT_FAILURE', 'NEGATIVE_MERCHANT_BALANCE', 'COD_MISMATCH', 'HIGH_REFUND_RATE', 'TAX_ANOMALY');
EXCEPTION WHEN duplicate_object THEN null; END $$;
