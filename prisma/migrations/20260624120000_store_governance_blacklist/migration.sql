-- CreateEnum
CREATE TYPE "RejectionType" AS ENUM ('DOCUMENT_ISSUE', 'COMPLIANCE_ISSUE', 'FRAUD', 'DUPLICATE_ACCOUNT', 'POLICY_VIOLATION');

-- AlterEnum
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'STORE_REJECTION_REVOKED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'MERCHANT_BLACKLISTED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'MERCHANT_BLACKLIST_REMOVED';

-- AlterTable: merchant_profiles
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "is_blacklisted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "blacklist_reason" TEXT;
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "blacklisted_at" TIMESTAMP(3);
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "blacklisted_by" TEXT;
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "blacklist_removed_at" TIMESTAMP(3);
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "blacklist_removed_by" TEXT;

CREATE INDEX IF NOT EXISTS "merchant_profiles_is_blacklisted_idx" ON "merchant_profiles"("is_blacklisted");

-- AlterTable: stores
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "rejection_type" "RejectionType";
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "rejection_revoked_at" TIMESTAMP(3);
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "rejection_revoked_by" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "rejection_revoke_reason" TEXT;
