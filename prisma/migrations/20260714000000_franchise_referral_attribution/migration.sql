-- Phase 1 — Franchise acquisition loop (referral attribution).
-- Additive only: every column is nullable or defaulted, so no ALTER can fail on
-- existing rows. Both FKs are ON DELETE SET NULL, so removing a franchise partner
-- can never cascade-delete a store or a merchant application.

-- CreateEnum
-- Parks an attribution link for admin review when the store's pincode falls inside
-- a different active partner's exclusive territory. Only ACTIVE links settle.
CREATE TYPE "FranchiseStoreStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'REJECTED');

-- AlterTable: referral code the partner shares in their invite link
ALTER TABLE "franchise_partners" ADD COLUMN     "referral_code" TEXT;

-- AlterTable: exclusivity-guard state on the attribution link.
-- DEFAULT 'ACTIVE' leaves every pre-existing franchise_stores row settling normally.
ALTER TABLE "franchise_stores" ADD COLUMN     "conflict_reason" TEXT,
ADD COLUMN     "status" "FranchiseStoreStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable: first-touch franchise attribution, alongside the existing utm_* fields
ALTER TABLE "merchant_applications" ADD COLUMN     "franchise_id" TEXT,
ADD COLUMN     "referral_code" TEXT;

-- AlterTable: attribution copied onto the store at approval (franchise_stores stays
-- the authoritative link that settlement reads; these preserve provenance)
ALTER TABLE "stores" ADD COLUMN     "franchise_id" TEXT,
ADD COLUMN     "referral_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "franchise_partners_referral_code_key" ON "franchise_partners"("referral_code");

-- CreateIndex
CREATE INDEX "franchise_stores_status_idx" ON "franchise_stores"("status");

-- CreateIndex
CREATE INDEX "merchant_applications_franchise_id_idx" ON "merchant_applications"("franchise_id");

-- CreateIndex
CREATE INDEX "stores_franchise_id_idx" ON "stores"("franchise_id");

-- AddForeignKey
ALTER TABLE "merchant_applications" ADD CONSTRAINT "merchant_applications_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: give every existing partner a referral code so their invite link works
-- immediately. Deterministic for the single seeded NCR partner; falls back to a
-- code derived from the cuid for any other pre-existing row.
UPDATE "franchise_partners"
   SET "referral_code" = 'FR-NCR-01'
 WHERE "referral_code" IS NULL
   AND "business_name" = 'NCR Franchise Partners Pvt Ltd';

UPDATE "franchise_partners"
   SET "referral_code" = 'FR-' || UPPER(RIGHT("id", 6))
 WHERE "referral_code" IS NULL;
