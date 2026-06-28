-- Merchant-controlled return / refund / replacement policies + order claims

CREATE TYPE "ClaimApprovalMode" AS ENUM ('AUTO', 'MANUAL');
CREATE TYPE "ClaimProofRequirement" AS ENUM ('NONE', 'PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO');
CREATE TYPE "ClaimRefundMethod" AS ENUM ('ORIGINAL_PAYMENT', 'WALLET', 'BOTH');
CREATE TYPE "PreparedFoodPolicy" AS ENUM ('NO_RETURN', 'REPLACEMENT_ONLY', 'REFUND_ONLY', 'MERCHANT_DECIDES');
CREATE TYPE "ReturnClaimReason" AS ENUM (
  'WRONG_ITEM',
  'DAMAGED',
  'MISSING_ITEM',
  'QUALITY_ISSUE',
  'EXPIRED_PRODUCT',
  'PACKAGING_DAMAGED',
  'NOT_AS_DESCRIBED',
  'CUSTOMER_CHANGED_MIND',
  'OTHER'
);
CREATE TYPE "OrderClaimType" AS ENUM ('RETURN', 'REFUND', 'REPLACEMENT');
CREATE TYPE "OrderClaimStatus" AS ENUM (
  'PENDING',
  'EVIDENCE_REQUESTED',
  'APPROVED',
  'REJECTED',
  'REPLACEMENT_APPROVED',
  'REPLACEMENT_SHIPPED',
  'REFUND_PROCESSING',
  'REFUND_PROCESSED',
  'CLOSED'
);
CREATE TYPE "ClaimActorType" AS ENUM ('BUYER', 'MERCHANT', 'ADMIN', 'SYSTEM');

ALTER TABLE "products" ADD COLUMN "is_returnable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "is_refundable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "is_replaceable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "return_window_hours" INTEGER;
ALTER TABLE "products" ADD COLUMN "approval_mode" "ClaimApprovalMode" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "products" ADD COLUMN "proof_required" "ClaimProofRequirement" NOT NULL DEFAULT 'NONE';
ALTER TABLE "products" ADD COLUMN "auto_approve_below_amount" DECIMAL(10,2);
ALTER TABLE "products" ADD COLUMN "return_reasons" "ReturnClaimReason"[] NOT NULL DEFAULT ARRAY[]::"ReturnClaimReason"[];
ALTER TABLE "products" ADD COLUMN "restocking_fee" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "refund_method" "ClaimRefundMethod" NOT NULL DEFAULT 'ORIGINAL_PAYMENT';
ALTER TABLE "products" ADD COLUMN "return_policy_text" TEXT;
ALTER TABLE "products" ADD COLUMN "replacement_policy_text" TEXT;
ALTER TABLE "products" ADD COLUMN "prepared_food_policy" "PreparedFoodPolicy";
ALTER TABLE "products" ADD COLUMN "allow_customer_changed_mind" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "order_claims" (
  "id" TEXT NOT NULL,
  "claim_number" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "claim_type" "OrderClaimType" NOT NULL,
  "status" "OrderClaimStatus" NOT NULL DEFAULT 'PENDING',
  "reason" "ReturnClaimReason" NOT NULL,
  "reason_note" TEXT,
  "requested_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "approved_amount" DECIMAL(10,2),
  "restocking_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "idempotency_key" TEXT,
  "merchant_note" TEXT,
  "admin_note" TEXT,
  "replacement_order_id" TEXT,
  "return_pickup_enabled" BOOLEAN NOT NULL DEFAULT false,
  "return_shipment_id" TEXT,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_claims_claim_number_key" ON "order_claims"("claim_number");
CREATE UNIQUE INDEX "order_claims_idempotency_key_key" ON "order_claims"("idempotency_key");
CREATE INDEX "order_claims_order_id_idx" ON "order_claims"("order_id");
CREATE INDEX "order_claims_store_id_status_idx" ON "order_claims"("store_id", "status");
CREATE INDEX "order_claims_buyer_profile_id_status_idx" ON "order_claims"("buyer_profile_id", "status");
CREATE INDEX "order_claims_status_created_at_idx" ON "order_claims"("status", "created_at" DESC);

ALTER TABLE "order_claims" ADD CONSTRAINT "order_claims_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_claims" ADD CONSTRAINT "order_claims_buyer_profile_id_fkey"
  FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_claims" ADD CONSTRAINT "order_claims_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "order_claim_items" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "order_item_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity_claimed" INTEGER NOT NULL,
  "quantity_approved" INTEGER,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "refund_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,

  CONSTRAINT "order_claim_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_claim_items_claim_id_idx" ON "order_claim_items"("claim_id");
CREATE INDEX "order_claim_items_order_item_id_idx" ON "order_claim_items"("order_item_id");

ALTER TABLE "order_claim_items" ADD CONSTRAINT "order_claim_items_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "order_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_claim_items" ADD CONSTRAINT "order_claim_items_order_item_id_fkey"
  FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_claim_items" ADD CONSTRAINT "order_claim_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "claim_evidence" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "claim_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "claim_evidence_claim_id_idx" ON "claim_evidence"("claim_id");

ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "order_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "claim_history" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "status" "OrderClaimStatus" NOT NULL,
  "actor_type" "ClaimActorType" NOT NULL,
  "actor_id" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "claim_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "claim_history_claim_id_created_at_idx" ON "claim_history"("claim_id", "created_at");

ALTER TABLE "claim_history" ADD CONSTRAINT "claim_history_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "order_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "claim_refunds" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "wallet_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "razorpay_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "razorpay_refund_id" TEXT,
  "wallet_txn_id" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "claim_refunds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "claim_refunds_claim_id_key" ON "claim_refunds"("claim_id");
CREATE UNIQUE INDEX "claim_refunds_idempotency_key_key" ON "claim_refunds"("idempotency_key");

ALTER TABLE "claim_refunds" ADD CONSTRAINT "claim_refunds_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "order_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "claim_replacements" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "replacement_order_id" TEXT NOT NULL,
  "shipment_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "shipped_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "claim_replacements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "claim_replacements_claim_id_key" ON "claim_replacements"("claim_id");

ALTER TABLE "claim_replacements" ADD CONSTRAINT "claim_replacements_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "order_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
