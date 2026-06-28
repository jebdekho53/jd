-- Merchant AI prepaid wallet + product image optimization fields

CREATE TYPE "MerchantAiWalletTransactionType" AS ENUM ('RECHARGE', 'DEBIT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "MerchantAiWalletTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TABLE "merchant_ai_wallets" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "balance_paise" INTEGER NOT NULL DEFAULT 0,
    "total_recharged_paise" INTEGER NOT NULL DEFAULT 0,
    "total_spent_paise" INTEGER NOT NULL DEFAULT 0,
    "total_refunded_paise" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_ai_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "merchant_ai_wallets_merchant_profile_id_key" ON "merchant_ai_wallets"("merchant_profile_id");

CREATE TABLE "merchant_ai_wallet_transactions" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT,
    "analysis_id" TEXT,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "type" "MerchantAiWalletTransactionType" NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "balance_before_paise" INTEGER NOT NULL,
    "balance_after_paise" INTEGER NOT NULL,
    "status" "MerchantAiWalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_ai_wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "merchant_ai_wallet_transactions_idempotency_key_key" ON "merchant_ai_wallet_transactions"("idempotency_key");
CREATE INDEX "merchant_ai_wallet_transactions_merchant_profile_id_created_at_idx" ON "merchant_ai_wallet_transactions"("merchant_profile_id", "created_at" DESC);
CREATE INDEX "merchant_ai_wallet_transactions_store_id_type_idx" ON "merchant_ai_wallet_transactions"("store_id", "type");
CREATE INDEX "merchant_ai_wallet_transactions_analysis_id_idx" ON "merchant_ai_wallet_transactions"("analysis_id");
CREATE INDEX "merchant_ai_wallet_transactions_razorpay_order_id_idx" ON "merchant_ai_wallet_transactions"("razorpay_order_id");

ALTER TABLE "merchant_ai_wallets" ADD CONSTRAINT "merchant_ai_wallets_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "merchant_ai_wallet_transactions" ADD CONSTRAINT "merchant_ai_wallet_transactions_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "merchant_ai_wallet_transactions" ADD CONSTRAINT "merchant_ai_wallet_transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchant_ai_wallet_transactions" ADD CONSTRAINT "merchant_ai_wallet_transactions_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_product_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_product_analyses" ADD COLUMN "original_image_url" TEXT;
ALTER TABLE "ai_product_analyses" ADD COLUMN "optimized_image_url" TEXT;
ALTER TABLE "ai_product_analyses" ADD COLUMN "thumbnail_image_url" TEXT;
ALTER TABLE "ai_product_analyses" ADD COLUMN "ai_analysis_image_url" TEXT;
