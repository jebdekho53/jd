-- Business integrity: webhook dedup, order refunds, provider COD, fraud alert types

-- AlterEnum FinanceAlertType
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'REFUND_FAILED';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_COD_FAILURES';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_REFUND_ABUSE';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_COUPON_FARMING';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_REFERRAL_ABUSE';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_WALLET_ABUSE';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_CANCELLATION_ABUSE';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_HIGH_RISK_MERCHANT';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_HIGH_RISK_BUYER';
ALTER TYPE "FinanceAlertType" ADD VALUE IF NOT EXISTS 'FRAUD_AI_BILLING_ABUSE';

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('RAZORPAY', 'SHADOWFAX');
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DUPLICATE');
CREATE TYPE "OrderRefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'REFUNDED', 'FAILED');
CREATE TYPE "OrderRefundInitiator" AS ENUM ('BUYER', 'MERCHANT', 'ADMIN', 'SYSTEM');

-- CodReconciliation: optional rider, provider COD support
ALTER TABLE "cod_reconciliations" ALTER COLUMN "rider_profile_id" DROP NOT NULL;
ALTER TABLE "cod_reconciliations" ADD COLUMN IF NOT EXISTS "provider_type" "DeliveryProviderType";

-- WebhookEvent
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "event_id" TEXT NOT NULL,
    "signature" TEXT,
    "payload_hash" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");
CREATE INDEX "webhook_events_provider_status_received_at_idx" ON "webhook_events"("provider", "status", "received_at" DESC);

-- OrderRefund
CREATE TABLE "order_refunds" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "wallet_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "razorpay_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "razorpay_refund_id" TEXT,
    "wallet_txn_id" TEXT,
    "status" "OrderRefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "initiated_by" TEXT,
    "initiator_type" "OrderRefundInitiator" NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_refunds_idempotency_key_key" ON "order_refunds"("idempotency_key");
CREATE INDEX "order_refunds_order_id_status_idx" ON "order_refunds"("order_id", "status");
CREATE INDEX "order_refunds_status_created_at_idx" ON "order_refunds"("status", "created_at" DESC);

ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
