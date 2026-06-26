-- AlterTable
ALTER TABLE "merchant_applications" ADD COLUMN "locality" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN "location_pincode_id" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN "location_area_id" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN "location_city_id" TEXT;

CREATE INDEX "merchant_applications_location_pincode_id_idx" ON "merchant_applications"("location_pincode_id");
CREATE INDEX "merchant_applications_location_city_id_idx" ON "merchant_applications"("location_city_id");
