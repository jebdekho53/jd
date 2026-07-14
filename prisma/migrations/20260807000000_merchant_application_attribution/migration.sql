-- First-touch acquisition attribution on merchant applications
-- (e.g. Meta/Google ads driving traffic to merchant.jebdekho.com).
ALTER TABLE "merchant_applications"
  ADD COLUMN "utm_source" TEXT,
  ADD COLUMN "utm_medium" TEXT,
  ADD COLUMN "utm_campaign" TEXT,
  ADD COLUMN "utm_content" TEXT,
  ADD COLUMN "fbclid" TEXT;

CREATE INDEX "merchant_applications_utm_source_created_at_idx"
  ON "merchant_applications" ("utm_source", "created_at");
