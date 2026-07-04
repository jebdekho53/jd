-- Baseline for ai_product_analyses.
-- The table + AIProductAnalysisStatus enum were originally created in the later
-- 20260730140000_merchant_ai_product_creation migration, but earlier migrations
-- (20260626120000_merchant_ai_wallet, 20260628120000_hyperlocal_super_app)
-- already ALTER/reference the table. Created here so a clean `migrate deploy`
-- replays in order; the later migration now creates them idempotently.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AIProductAnalysisStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_product_analyses" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "uploaded_image_url" TEXT NOT NULL,
    "extracted_json" JSONB,
    "confidence" DOUBLE PRECISION,
    "status" "AIProductAnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
    "error_message" TEXT,
    "created_product_id" TEXT,
    "charge_amount_paise" INTEGER NOT NULL DEFAULT 150,
    "charged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_product_analyses_pkey" PRIMARY KEY ("id")
);
