-- Baseline for merchant_applications.
-- The enums and the merchant_applications table were originally created in the
-- later 20260725120000_merchant_onboarding migration, but several earlier
-- migrations (20260623120000_merchant_application_mld,
-- 20260626120000_merchant_application_store_branding,
-- 20260628120000_hyperlocal_super_app) already ALTER/reference them. This
-- migration creates them at the correct point so a clean `migrate deploy`
-- replays in order. The onboarding migration now creates them idempotently.

-- CreateEnum
CREATE TYPE "MerchantApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'KYC_PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MerchantBusinessType" AS ENUM ('GROCERY', 'RESTAURANT', 'PHARMACY', 'ELECTRONICS', 'FASHION', 'PET_STORE', 'BEAUTY', 'HEALTH_NUTRITION', 'BAKERY', 'STATIONERY', 'OTHER');

-- CreateTable
CREATE TABLE "merchant_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "merchant_profile_id" TEXT,
    "store_id" TEXT,
    "status" "MerchantApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "owner_name" TEXT,
    "owner_email" TEXT,
    "owner_phone" TEXT,
    "business_name" TEXT,
    "business_type" "MerchantBusinessType",
    "gst_number" TEXT,
    "gst_verified" BOOLEAN NOT NULL DEFAULT false,
    "pan_number" TEXT,
    "store_name" TEXT,
    "store_address" TEXT,
    "state" TEXT,
    "city" TEXT,
    "city_id" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "delivery_radius_km" DOUBLE PRECISION,
    "rejection_reason" TEXT,
    "admin_notes" TEXT,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_flags" JSONB,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_applications_pkey" PRIMARY KEY ("id")
);
