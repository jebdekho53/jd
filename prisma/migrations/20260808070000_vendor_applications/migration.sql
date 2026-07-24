-- Vendor-partner onboarding. Deliberately flat (mirrors expansion_leads, not
-- the multi-step merchant_applications) — Vendor itself carries no KYC/workflow
-- state, so there's no per-step draft to persist.

CREATE TYPE "VendorApplicationStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "vendor_applications" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city_id" TEXT,
    "line1" TEXT,
    "pincode" TEXT,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "status" "VendorApplicationStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "password_hash" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "converted_vendor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_applications_converted_vendor_id_key" ON "vendor_applications"("converted_vendor_id");
CREATE INDEX "vendor_applications_status_created_at_idx" ON "vendor_applications"("status", "created_at" DESC);
CREATE INDEX "vendor_applications_phone_idx" ON "vendor_applications"("phone");

ALTER TABLE "vendor_applications" ADD CONSTRAINT "vendor_applications_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_applications" ADD CONSTRAINT "vendor_applications_converted_vendor_id_fkey" FOREIGN KEY ("converted_vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
