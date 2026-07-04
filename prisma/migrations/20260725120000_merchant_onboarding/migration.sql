-- CreateEnum (created earlier in 20260623100000_merchant_applications_base; guard for clean replay)
DO $$ BEGIN
    CREATE TYPE "MerchantApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'KYC_PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum (created earlier in 20260623100000_merchant_applications_base; guard for clean replay)
DO $$ BEGIN
    CREATE TYPE "MerchantBusinessType" AS ENUM ('GROCERY', 'RESTAURANT', 'PHARMACY', 'ELECTRONICS', 'FASHION', 'PET_STORE', 'BEAUTY', 'HEALTH_NUTRITION', 'BAKERY', 'STATIONERY', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
CREATE TYPE "MerchantDocumentType" AS ENUM ('GST_CERTIFICATE', 'PAN_CARD', 'SHOP_LICENSE', 'FSSAI_LICENSE', 'CANCELLED_CHEQUE', 'OWNER_PHOTO', 'STORE_PHOTO', 'TRADE_LICENSE', 'BANK_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "MerchantOnboardingStepKey" AS ENUM ('PERSONAL_DETAILS', 'BUSINESS_DETAILS', 'STORE_DETAILS', 'DOCUMENTS', 'BANK_DETAILS', 'REVIEW');

-- CreateEnum
CREATE TYPE "MerchantKycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- AlterEnum
ALTER TYPE "MarketingEventType" ADD VALUE 'MERCHANT_SIGNUP';
ALTER TYPE "MarketingEventType" ADD VALUE 'MERCHANT_APPLICATION_SUBMITTED';
ALTER TYPE "MarketingEventType" ADD VALUE 'MERCHANT_APPROVED';

-- CreateTable (created earlier in 20260623100000_merchant_applications_base; guard for clean replay)
CREATE TABLE IF NOT EXISTS "merchant_applications" (
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

-- CreateTable
CREATE TABLE "merchant_documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "document_type" "MerchantDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_kyc" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" "MerchantKycStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_bank_accounts" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "upi_id" TEXT,
    "bank_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_onboarding_steps" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "step_key" "MerchantOnboardingStepKey" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "data" JSONB,

    CONSTRAINT "merchant_onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_applications_merchant_profile_id_key" ON "merchant_applications"("merchant_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_applications_store_id_key" ON "merchant_applications"("store_id");

-- CreateIndex
CREATE INDEX "merchant_applications_user_id_idx" ON "merchant_applications"("user_id");

-- CreateIndex
CREATE INDEX "merchant_applications_status_created_at_idx" ON "merchant_applications"("status", "created_at");

-- CreateIndex
CREATE INDEX "merchant_documents_application_id_idx" ON "merchant_documents"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_kyc_application_id_key" ON "merchant_kyc"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_bank_accounts_application_id_key" ON "merchant_bank_accounts"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_onboarding_steps_application_id_step_key_key" ON "merchant_onboarding_steps"("application_id", "step_key");

-- AddForeignKey
ALTER TABLE "merchant_applications" ADD CONSTRAINT "merchant_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_applications" ADD CONSTRAINT "merchant_applications_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_applications" ADD CONSTRAINT "merchant_applications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_documents" ADD CONSTRAINT "merchant_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_kyc" ADD CONSTRAINT "merchant_kyc_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_bank_accounts" ADD CONSTRAINT "merchant_bank_accounts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_onboarding_steps" ADD CONSTRAINT "merchant_onboarding_steps_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Support category for merchant onboarding
INSERT INTO "support_categories" ("id", "code", "name", "audience", "description", "sort_order")
VALUES ('sc_m_onboard', 'MERCHANT_ONBOARDING', 'Merchant Onboarding', 'MERCHANT', 'New merchant signup and application help', 9)
ON CONFLICT ("code") DO NOTHING;
