-- CreateEnum
CREATE TYPE "AIProductAnalysisStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MerchantAiCreditTransactionType" AS ENUM ('DEBIT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MerchantAiCreditTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ai_product_analyses" (
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

-- CreateTable
CREATE TABLE "merchant_ai_credit_transactions" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "type" "MerchantAiCreditTransactionType" NOT NULL,
    "status" "MerchantAiCreditTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_ai_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_product_analyses_created_product_id_key" ON "ai_product_analyses"("created_product_id");

-- CreateIndex
CREATE INDEX "ai_product_analyses_merchant_profile_id_created_at_idx" ON "ai_product_analyses"("merchant_profile_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_product_analyses_store_id_status_idx" ON "ai_product_analyses"("store_id", "status");

-- CreateIndex
CREATE INDEX "ai_product_analyses_status_created_at_idx" ON "ai_product_analyses"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_ai_credit_transactions_idempotency_key_key" ON "merchant_ai_credit_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "merchant_ai_credit_transactions_merchant_profile_id_created_idx" ON "merchant_ai_credit_transactions"("merchant_profile_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "merchant_ai_credit_transactions_store_id_type_idx" ON "merchant_ai_credit_transactions"("store_id", "type");

-- CreateIndex
CREATE INDEX "merchant_ai_credit_transactions_analysis_id_idx" ON "merchant_ai_credit_transactions"("analysis_id");

-- AddForeignKey
ALTER TABLE "ai_product_analyses" ADD CONSTRAINT "ai_product_analyses_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_product_analyses" ADD CONSTRAINT "ai_product_analyses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_product_analyses" ADD CONSTRAINT "ai_product_analyses_created_product_id_fkey" FOREIGN KEY ("created_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_ai_credit_transactions" ADD CONSTRAINT "merchant_ai_credit_transactions_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_ai_credit_transactions" ADD CONSTRAINT "merchant_ai_credit_transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_ai_credit_transactions" ADD CONSTRAINT "merchant_ai_credit_transactions_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_product_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
