-- P3.3 Offers, coupons & promotions engine

CREATE TYPE "CouponKind" AS ENUM (
  'GENERIC',
  'WELCOME50',
  'FLAT100',
  'FIRSTORDER',
  'STORE_SPECIFIC',
  'CATEGORY_SPECIFIC',
  'MERCHANT_SPONSORED',
  'PLATFORM_SPONSORED'
);

CREATE TYPE "OfferSponsor" AS ENUM ('MERCHANT', 'PLATFORM');

CREATE TYPE "PromotionOfferType" AS ENUM (
  'PERCENTAGE_DISCOUNT',
  'FLAT_DISCOUNT',
  'BUY_X_GET_Y',
  'FREE_DELIVERY',
  'COMBO'
);

CREATE TYPE "PromotionTarget" AS ENUM ('STORE_WIDE', 'CATEGORY', 'PRODUCT');

ALTER TABLE "coupons" ADD COLUMN "kind" "CouponKind" NOT NULL DEFAULT 'GENERIC';
ALTER TABLE "coupons" ADD COLUMN "sponsor" "OfferSponsor" NOT NULL DEFAULT 'PLATFORM';
ALTER TABLE "coupons" ADD COLUMN "category_id" TEXT;
ALTER TABLE "coupons" ADD COLUMN "product_id" TEXT;
ALTER TABLE "coupons" ADD COLUMN "first_order_only" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coupons" ADD COLUMN "suspended_at" TIMESTAMP(3);
ALTER TABLE "coupons" ADD COLUMN "suspended_by" TEXT;
ALTER TABLE "coupons" ADD COLUMN "created_by_id" TEXT;

ALTER TABLE "carts" ADD COLUMN "applied_coupon_id" TEXT;
ALTER TABLE "carts" ADD COLUMN "applied_promotion_id" TEXT;

CREATE TABLE "store_promotions" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "offer_type" "PromotionOfferType" NOT NULL,
  "target" "PromotionTarget" NOT NULL DEFAULT 'STORE_WIDE',
  "category_id" TEXT,
  "product_id" TEXT,
  "discount_value" DECIMAL(10,2) NOT NULL,
  "buy_quantity" INTEGER,
  "get_quantity" INTEGER,
  "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "max_discount" DECIMAL(10,2),
  "usage_limit" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "paused_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "store_promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_usages" (
  "id" TEXT NOT NULL,
  "promotion_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "discount_applied" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "promotion_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promotion_usages_order_id_key" ON "promotion_usages"("order_id");
CREATE INDEX "promotion_usages_promotion_id_idx" ON "promotion_usages"("promotion_id");
CREATE INDEX "promotion_usages_buyer_profile_id_idx" ON "promotion_usages"("buyer_profile_id");

CREATE INDEX "store_promotions_store_id_is_active_idx" ON "store_promotions"("store_id", "is_active");
CREATE INDEX "store_promotions_store_id_expires_at_idx" ON "store_promotions"("store_id", "expires_at");
CREATE INDEX "store_promotions_offer_type_idx" ON "store_promotions"("offer_type");

CREATE INDEX "coupons_category_id_idx" ON "coupons"("category_id");
CREATE INDEX "coupons_kind_is_active_idx" ON "coupons"("kind", "is_active");

ALTER TABLE "coupons" ADD CONSTRAINT "coupons_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "carts" ADD CONSTRAINT "carts_applied_coupon_id_fkey"
  FOREIGN KEY ("applied_coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_applied_promotion_id_fkey"
  FOREIGN KEY ("applied_promotion_id") REFERENCES "store_promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "store_promotions" ADD CONSTRAINT "store_promotions_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_promotions" ADD CONSTRAINT "store_promotions_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "store_promotions" ADD CONSTRAINT "store_promotions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "promotion_usages" ADD CONSTRAINT "promotion_usages_promotion_id_fkey"
  FOREIGN KEY ("promotion_id") REFERENCES "store_promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_usages" ADD CONSTRAINT "promotion_usages_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
