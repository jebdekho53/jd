-- Product compliance / PDP metadata
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ingredients" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shelf_life" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "country_of_origin" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manufacturer_name" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manufacturer_address" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fssai_license" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "storage_instructions" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "disclaimer" TEXT;

-- Product-level reviews (verified purchase)
CREATE TABLE IF NOT EXISTS "product_reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "buyer_profile_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_item_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified_purchase" BOOLEAN NOT NULL DEFAULT true,
    "status" "ReviewStatus" NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_user_id_product_id_key" ON "product_reviews"("user_id", "product_id");
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_status_idx" ON "product_reviews"("product_id", "status");
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_created_at_idx" ON "product_reviews"("product_id", "created_at" DESC);

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_product_id_fkey";
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_user_id_fkey";
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_buyer_profile_id_fkey";
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_buyer_profile_id_fkey" FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_order_id_fkey";
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_order_item_id_fkey";
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
