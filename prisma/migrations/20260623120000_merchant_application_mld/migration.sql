-- AlterTable
ALTER TABLE "merchant_applications" ADD COLUMN IF NOT EXISTS "locality" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN IF NOT EXISTS "location_pincode_id" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN IF NOT EXISTS "location_area_id" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN IF NOT EXISTS "location_city_id" TEXT;

CREATE INDEX IF NOT EXISTS "merchant_applications_location_pincode_id_idx" ON "merchant_applications"("location_pincode_id");
CREATE INDEX IF NOT EXISTS "merchant_applications_location_city_id_idx" ON "merchant_applications"("location_city_id");
