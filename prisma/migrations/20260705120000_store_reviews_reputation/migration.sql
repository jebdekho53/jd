-- P3.2 Store reviews & reputation

CREATE TYPE "ReviewStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED', 'REPORTED');

ALTER TABLE "reviews" ADD COLUMN "store_experience" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "reviews" ADD COLUMN "delivery_experience" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "reviews" ADD COLUMN "product_quality" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "reviews" ADD COLUMN "title" TEXT;
ALTER TABLE "reviews" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "reviews" ADD COLUMN "verified_purchase" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "reviews" ADD COLUMN "merchant_reply" TEXT;
ALTER TABLE "reviews" ADD COLUMN "merchant_replied_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'VISIBLE';
ALTER TABLE "reviews" ADD COLUMN "reported_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN "report_reason" TEXT;
ALTER TABLE "reviews" ADD COLUMN "moderated_by" TEXT;
ALTER TABLE "reviews" ADD COLUMN "moderated_at" TIMESTAMP(3);

ALTER TABLE "stores" ADD COLUMN "reputation_stats" JSONB;

CREATE INDEX "reviews_store_id_status_idx" ON "reviews"("store_id", "status");
CREATE INDEX "reviews_store_id_created_at_idx" ON "reviews"("store_id", "created_at" DESC);
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_profile_id_fkey"
    FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
