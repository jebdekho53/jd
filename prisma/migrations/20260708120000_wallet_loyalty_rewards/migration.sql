-- P3.5 Wallet, Loyalty, Rewards & Customer Retention

CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'REFUND', 'REWARD_CREDIT', 'ADMIN_ADJUSTMENT', 'EXPIRY');
CREATE TYPE "WalletLedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "RewardTransactionType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT', 'REFERRAL_BONUS');
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'FRAUD_FLAGGED');
CREATE TYPE "WalletFraudReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'WALLET';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'WALLET_RAZORPAY';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'WALLET_COD';

ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'WALLET_CREDITED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'WALLET_DEBITED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'REWARD_EARNED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'REWARD_REDEEMED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'TIER_UPGRADED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'REFERRAL_COMPLETED';

ALTER TABLE "orders" ADD COLUMN "wallet_amount_used" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "reward_points_used" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "reward_points_earned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "razorpay_amount" DECIMAL(10,2);

CREATE TABLE "buyer_wallets" (
  "id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "reward_points" INTEGER NOT NULL DEFAULT 0,
  "lifetime_points" INTEGER NOT NULL DEFAULT 0,
  "tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
  "referral_code" TEXT NOT NULL,
  "referred_by_id" TEXT,
  "device_fingerprint" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "buyer_wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_transactions" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "balance_after" DECIMAL(12,2) NOT NULL,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "description" TEXT,
  "expires_at" TIMESTAMP(3),
  "idempotency_key" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_ledger_entries" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "transaction_id" TEXT NOT NULL,
  "entry_type" "WalletLedgerEntryType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "balance_before" DECIMAL(12,2) NOT NULL,
  "balance_after" DECIMAL(12,2) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reward_transactions" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "type" "RewardTransactionType" NOT NULL,
  "points" INTEGER NOT NULL,
  "points_after" INTEGER NOT NULL,
  "order_id" TEXT,
  "reference_id" TEXT,
  "description" TEXT,
  "expires_at" TIMESTAMP(3),
  "idempotency_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reward_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referrals" (
  "id" TEXT NOT NULL,
  "referrer_wallet_id" TEXT NOT NULL,
  "referred_wallet_id" TEXT NOT NULL,
  "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
  "referrer_reward_points" INTEGER,
  "referred_reward_points" INTEGER,
  "referrer_wallet_credit" DECIMAL(10,2),
  "referred_wallet_credit" DECIMAL(10,2),
  "device_fingerprint" TEXT,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reward_program_configs" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updated_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reward_program_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_fraud_reviews" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "review_type" TEXT NOT NULL,
  "status" "WalletFraudReviewStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_fraud_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "buyer_wallets_buyer_profile_id_key" ON "buyer_wallets"("buyer_profile_id");
CREATE UNIQUE INDEX "buyer_wallets_referral_code_key" ON "buyer_wallets"("referral_code");
CREATE INDEX "buyer_wallets_tier_idx" ON "buyer_wallets"("tier");
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at" DESC);
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx" ON "wallet_transactions"("reference_type", "reference_id");
CREATE INDEX "wallet_ledger_entries_wallet_id_created_at_idx" ON "wallet_ledger_entries"("wallet_id", "created_at" DESC);
CREATE UNIQUE INDEX "reward_transactions_order_id_key" ON "reward_transactions"("order_id");
CREATE UNIQUE INDEX "reward_transactions_idempotency_key_key" ON "reward_transactions"("idempotency_key");
CREATE INDEX "reward_transactions_wallet_id_created_at_idx" ON "reward_transactions"("wallet_id", "created_at" DESC);
CREATE UNIQUE INDEX "referrals_referred_wallet_id_key" ON "referrals"("referred_wallet_id");
CREATE INDEX "referrals_referrer_wallet_id_idx" ON "referrals"("referrer_wallet_id");
CREATE INDEX "referrals_status_idx" ON "referrals"("status");
CREATE UNIQUE INDEX "reward_program_configs_key_key" ON "reward_program_configs"("key");
CREATE INDEX "wallet_fraud_reviews_status_created_at_idx" ON "wallet_fraud_reviews"("status", "created_at" DESC);

ALTER TABLE "buyer_wallets" ADD CONSTRAINT "buyer_wallets_buyer_profile_id_fkey" FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_wallets" ADD CONSTRAINT "buyer_wallets_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "buyer_wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "buyer_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "buyer_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reward_transactions" ADD CONSTRAINT "reward_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "buyer_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_wallet_id_fkey" FOREIGN KEY ("referrer_wallet_id") REFERENCES "buyer_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_wallet_id_fkey" FOREIGN KEY ("referred_wallet_id") REFERENCES "buyer_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_fraud_reviews" ADD CONSTRAINT "wallet_fraud_reviews_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "buyer_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default reward program config
INSERT INTO "reward_program_configs" ("id", "key", "value", "updated_at")
VALUES
  ('cfg_points_per_100', 'points_per_100_inr', '{"value": 1}', NOW()),
  ('cfg_point_value', 'point_value_inr', '{"value": 1}', NOW()),
  ('cfg_referral', 'referral_rewards', '{"referrerPoints": 50, "referredPoints": 25, "referrerWalletCredit": 50, "referredWalletCredit": 100}', NOW()),
  ('cfg_tiers', 'tier_thresholds', '{"silver": 500, "gold": 2000, "platinum": 5000}', NOW()),
  ('cfg_tier_multipliers', 'tier_point_multipliers', '{"BRONZE": 1, "SILVER": 1.1, "GOLD": 1.25, "PLATINUM": 1.5}', NOW())
ON CONFLICT ("key") DO NOTHING;
