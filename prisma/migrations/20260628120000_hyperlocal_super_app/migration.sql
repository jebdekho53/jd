-- Hyperlocal Super App: verticals, restaurant menu, food cart (additive)

-- Extend MerchantBusinessType enum
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'CLOUD_KITCHEN';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'CAFE';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'SWEETS';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'FRUITS_VEGETABLES';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'MEAT_FISH';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'HOME_KITCHEN';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'BABY_STORE';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'SUPPLEMENTS';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'FLOWERS';
ALTER TYPE "MerchantBusinessType" ADD VALUE IF NOT EXISTS 'LOCAL_STORE';

-- New enums
CREATE TYPE "VerticalBusinessType" AS ENUM (
  'GROCERY', 'RESTAURANT', 'CLOUD_KITCHEN', 'CAFE', 'BAKERY', 'SWEETS',
  'FRUITS_VEGETABLES', 'MEAT_FISH', 'BEAUTY', 'PET_STORE', 'HOME_KITCHEN',
  'ELECTRONICS', 'BABY_STORE', 'SUPPLEMENTS', 'FLOWERS', 'LOCAL_STORE'
);

CREATE TYPE "StoreBusinessTypeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "OrderVertical" AS ENUM ('GROCERY', 'FOOD');
CREATE TYPE "DietType" AS ENUM ('VEG', 'NON_VEG', 'EGG');
CREATE TYPE "SpiceLevel" AS ENUM ('MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT');
CREATE TYPE "AddonSelectionType" AS ENUM ('SINGLE', 'MULTIPLE');
CREATE TYPE "MenuItemAvailability" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'HIDDEN');
CREATE TYPE "FoodKitchenStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'COMPLETED');
CREATE TYPE "AIProductType" AS ENUM (
  'PACKAGED_PRODUCT', 'FRESH_FOOD', 'RESTAURANT_FOOD', 'SUPPLEMENT',
  'ELECTRONICS', 'BEAUTY', 'PET', 'FLOWERS', 'UNKNOWN'
);
CREATE TYPE "MenuOcrStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'DRAFT_READY', 'FAILED', 'PUBLISHED');
CREATE TYPE "MenuCategorySlug" AS ENUM (
  'PIZZA', 'BURGER', 'ROLLS', 'CHINESE', 'BIRYANI', 'SOUTH_INDIAN', 'NORTH_INDIAN',
  'DESSERTS', 'BEVERAGES', 'COFFEE', 'FAST_FOOD', 'HEALTHY', 'STREET_FOOD', 'OTHER'
);

-- Order extensions (backward compatible defaults)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_vertical" "OrderVertical" NOT NULL DEFAULT 'GROCERY';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packaging_fee" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "scheduled_delivery_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "special_instructions" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "restaurant_note" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "kitchen_status" "FoodKitchenStatus";

-- AI product analysis extension
ALTER TABLE "ai_product_analyses" ADD COLUMN IF NOT EXISTS "detected_product_type" "AIProductType";

-- Merchant application business types (multi-select)
CREATE TABLE "merchant_application_business_types" (
  "id" TEXT NOT NULL,
  "application_id" TEXT NOT NULL,
  "business_type" "VerticalBusinessType" NOT NULL,
  "status" "StoreBusinessTypeStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "merchant_application_business_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "merchant_application_business_types_application_id_business_type_key"
  ON "merchant_application_business_types"("application_id", "business_type");
CREATE INDEX "merchant_application_business_types_application_id_status_idx"
  ON "merchant_application_business_types"("application_id", "status");

ALTER TABLE "merchant_application_business_types"
  ADD CONSTRAINT "merchant_application_business_types_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Store business types
CREATE TABLE "store_business_types" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "business_type" "VerticalBusinessType" NOT NULL,
  "status" "StoreBusinessTypeStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "store_business_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_business_types_store_id_business_type_key" ON "store_business_types"("store_id", "business_type");
CREATE INDEX "store_business_types_store_id_status_idx" ON "store_business_types"("store_id", "status");
CREATE INDEX "store_business_types_business_type_status_idx" ON "store_business_types"("business_type", "status");

ALTER TABLE "store_business_types"
  ADD CONSTRAINT "store_business_types_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cuisines
CREATE TABLE "cuisines" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cuisines_slug_key" ON "cuisines"("slug");
CREATE INDEX "cuisines_is_active_sort_order_idx" ON "cuisines"("is_active", "sort_order");

-- Restaurant profile
CREATE TABLE "restaurant_profiles" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "avg_prep_time_mins" INTEGER NOT NULL DEFAULT 25,
  "packaging_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "accepts_scheduled" BOOLEAN NOT NULL DEFAULT true,
  "is_cloud_kitchen" BOOLEAN NOT NULL DEFAULT false,
  "cost_for_two" DECIMAL(10,2),
  "acceptance_rate" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_profiles_store_id_key" ON "restaurant_profiles"("store_id");

ALTER TABLE "restaurant_profiles"
  ADD CONSTRAINT "restaurant_profiles_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "store_cuisines" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "cuisine_id" TEXT NOT NULL,
  CONSTRAINT "store_cuisines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_cuisines_store_id_cuisine_id_key" ON "store_cuisines"("store_id", "cuisine_id");

ALTER TABLE "store_cuisines"
  ADD CONSTRAINT "store_cuisines_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "restaurant_profiles"("store_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_cuisines"
  ADD CONSTRAINT "store_cuisines_cuisine_id_fkey"
  FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Restaurant menu
CREATE TABLE "restaurant_menu_categories" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category_slug" "MenuCategorySlug",
  "description" TEXT,
  "image_url" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_menu_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_menu_categories_store_id_slug_key" ON "restaurant_menu_categories"("store_id", "slug");
CREATE INDEX "restaurant_menu_categories_store_id_is_active_sort_order_idx" ON "restaurant_menu_categories"("store_id", "is_active", "sort_order");

ALTER TABLE "restaurant_menu_categories"
  ADD CONSTRAINT "restaurant_menu_categories_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_menu_items" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "image_urls" JSONB NOT NULL DEFAULT '[]',
  "base_price" DECIMAL(10,2) NOT NULL,
  "mrp" DECIMAL(10,2),
  "diet_type" "DietType" NOT NULL DEFAULT 'VEG',
  "spice_level" "SpiceLevel",
  "prep_time_mins" INTEGER NOT NULL DEFAULT 15,
  "serving_size" TEXT,
  "cuisine_name" TEXT,
  "availability" "MenuItemAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "allows_special_instructions" BOOLEAN NOT NULL DEFAULT true,
  "is_combo" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "rating_count" INTEGER NOT NULL DEFAULT 0,
  "order_count" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_menu_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_menu_items_store_id_slug_key" ON "restaurant_menu_items"("store_id", "slug");
CREATE INDEX "restaurant_menu_items_store_id_category_id_is_active_idx" ON "restaurant_menu_items"("store_id", "category_id", "is_active");
CREATE INDEX "restaurant_menu_items_store_id_availability_idx" ON "restaurant_menu_items"("store_id", "availability");

ALTER TABLE "restaurant_menu_items"
  ADD CONSTRAINT "restaurant_menu_items_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_menu_items"
  ADD CONSTRAINT "restaurant_menu_items_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "restaurant_menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_menu_item_variants" (
  "id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "availability" "MenuItemAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_menu_item_variants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "restaurant_menu_item_variants_menu_item_id_sort_order_idx" ON "restaurant_menu_item_variants"("menu_item_id", "sort_order");

ALTER TABLE "restaurant_menu_item_variants"
  ADD CONSTRAINT "restaurant_menu_item_variants_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "restaurant_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_addon_groups" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "selection_type" "AddonSelectionType" NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "min_selections" INTEGER NOT NULL DEFAULT 0,
  "max_selections" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_addon_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "restaurant_addon_groups_store_id_is_active_idx" ON "restaurant_addon_groups"("store_id", "is_active");

ALTER TABLE "restaurant_addon_groups"
  ADD CONSTRAINT "restaurant_addon_groups_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_addons" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "diet_type" "DietType",
  "availability" "MenuItemAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_addons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "restaurant_addons_group_id_sort_order_idx" ON "restaurant_addons"("group_id", "sort_order");

ALTER TABLE "restaurant_addons"
  ADD CONSTRAINT "restaurant_addons_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "restaurant_addon_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_menu_item_addon_groups" (
  "id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "restaurant_menu_item_addon_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_menu_item_addon_groups_menu_item_id_group_id_key"
  ON "restaurant_menu_item_addon_groups"("menu_item_id", "group_id");

ALTER TABLE "restaurant_menu_item_addon_groups"
  ADD CONSTRAINT "restaurant_menu_item_addon_groups_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "restaurant_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_menu_item_addon_groups"
  ADD CONSTRAINT "restaurant_menu_item_addon_groups_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "restaurant_addon_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_combos" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "combo_price" DECIMAL(10,2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_combos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_combos_store_id_slug_key" ON "restaurant_combos"("store_id", "slug");
CREATE INDEX "restaurant_combos_store_id_is_active_idx" ON "restaurant_combos"("store_id", "is_active");

ALTER TABLE "restaurant_combos"
  ADD CONSTRAINT "restaurant_combos_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "restaurant_combo_items" (
  "id" TEXT NOT NULL,
  "combo_id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "restaurant_combo_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_combo_items_combo_id_menu_item_id_key" ON "restaurant_combo_items"("combo_id", "menu_item_id");

ALTER TABLE "restaurant_combo_items"
  ADD CONSTRAINT "restaurant_combo_items_combo_id_fkey"
  FOREIGN KEY ("combo_id") REFERENCES "restaurant_combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_combo_items"
  ADD CONSTRAINT "restaurant_combo_items_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "restaurant_menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Food cart (separate from grocery cart)
CREATE TABLE "food_carts" (
  "id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "applied_coupon_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_carts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "food_carts_buyer_profile_id_store_id_key" ON "food_carts"("buyer_profile_id", "store_id");
CREATE INDEX "food_carts_buyer_profile_id_idx" ON "food_carts"("buyer_profile_id");

ALTER TABLE "food_carts"
  ADD CONSTRAINT "food_carts_buyer_profile_id_fkey"
  FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_carts"
  ADD CONSTRAINT "food_carts_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_carts"
  ADD CONSTRAINT "food_carts_applied_coupon_id_fkey"
  FOREIGN KEY ("applied_coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "food_cart_items" (
  "id" TEXT NOT NULL,
  "food_cart_id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "variant_id" TEXT,
  "combo_id" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "special_instructions" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_cart_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_cart_items_food_cart_id_idx" ON "food_cart_items"("food_cart_id");

ALTER TABLE "food_cart_items"
  ADD CONSTRAINT "food_cart_items_food_cart_id_fkey"
  FOREIGN KEY ("food_cart_id") REFERENCES "food_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_cart_items"
  ADD CONSTRAINT "food_cart_items_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "restaurant_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_cart_items"
  ADD CONSTRAINT "food_cart_items_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "restaurant_menu_item_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "food_cart_item_addons" (
  "id" TEXT NOT NULL,
  "cart_item_id" TEXT NOT NULL,
  "addon_id" TEXT NOT NULL,
  "addon_group_id" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "food_cart_item_addons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_cart_item_addons_cart_item_id_idx" ON "food_cart_item_addons"("cart_item_id");

ALTER TABLE "food_cart_item_addons"
  ADD CONSTRAINT "food_cart_item_addons_cart_item_id_fkey"
  FOREIGN KEY ("cart_item_id") REFERENCES "food_cart_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "food_cart_item_addons"
  ADD CONSTRAINT "food_cart_item_addons_addon_id_fkey"
  FOREIGN KEY ("addon_id") REFERENCES "restaurant_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Food checkout
CREATE TABLE "food_checkouts" (
  "id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "packaging_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(10,2) NOT NULL,
  "delivery_address" JSONB NOT NULL,
  "delivery_lat" DOUBLE PRECISION NOT NULL,
  "delivery_lng" DOUBLE PRECISION NOT NULL,
  "scheduled_delivery_at" TIMESTAMP(3),
  "special_instructions" TEXT,
  "restaurant_note" TEXT,
  "payment_method" "PaymentMethod" NOT NULL,
  "coupon_id" TEXT,
  "order_id" TEXT,
  "idempotency_key" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_checkouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "food_checkouts_order_id_key" ON "food_checkouts"("order_id");
CREATE UNIQUE INDEX "food_checkouts_idempotency_key_key" ON "food_checkouts"("idempotency_key");
CREATE INDEX "food_checkouts_buyer_profile_id_status_idx" ON "food_checkouts"("buyer_profile_id", "status");

ALTER TABLE "food_checkouts"
  ADD CONSTRAINT "food_checkouts_buyer_profile_id_fkey"
  FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Food order items
CREATE TABLE "food_order_items" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "variant_id" TEXT,
  "item_name" TEXT NOT NULL,
  "variant_name" TEXT,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total_price" DECIMAL(10,2) NOT NULL,
  "special_instructions" TEXT,
  "addons_snapshot" JSONB,
  CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "food_order_items_order_id_idx" ON "food_order_items"("order_id");

ALTER TABLE "food_order_items"
  ADD CONSTRAINT "food_order_items_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Menu OCR
CREATE TABLE "menu_ocr_jobs" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "status" "MenuOcrStatus" NOT NULL DEFAULT 'UPLOADED',
  "extracted_json" JSONB,
  "draft_menu_json" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "menu_ocr_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "menu_ocr_jobs_store_id_status_idx" ON "menu_ocr_jobs"("store_id", "status");

ALTER TABLE "menu_ocr_jobs"
  ADD CONSTRAINT "menu_ocr_jobs_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Menu search index
CREATE TABLE "restaurant_menu_search_index" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "cuisine_name" TEXT,
  "category_name" TEXT,
  "diet_type" "DietType" NOT NULL,
  "search_vector" tsvector,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_menu_search_index_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_menu_search_index_menu_item_id_key" ON "restaurant_menu_search_index"("menu_item_id");
CREATE INDEX "restaurant_menu_search_index_store_id_idx" ON "restaurant_menu_search_index"("store_id");
CREATE INDEX "restaurant_menu_search_index_search_vector_idx" ON "restaurant_menu_search_index" USING GIN ("search_vector");

-- Seed default cuisines
INSERT INTO "cuisines" ("id", "name", "slug", "sort_order", "updated_at") VALUES
  ('cuisine_north_indian', 'North Indian', 'north-indian', 1, CURRENT_TIMESTAMP),
  ('cuisine_south_indian', 'South Indian', 'south-indian', 2, CURRENT_TIMESTAMP),
  ('cuisine_chinese', 'Chinese', 'chinese', 3, CURRENT_TIMESTAMP),
  ('cuisine_italian', 'Italian', 'italian', 4, CURRENT_TIMESTAMP),
  ('cuisine_continental', 'Continental', 'continental', 5, CURRENT_TIMESTAMP),
  ('cuisine_biryani', 'Biryani', 'biryani', 6, CURRENT_TIMESTAMP),
  ('cuisine_fast_food', 'Fast Food', 'fast-food', 7, CURRENT_TIMESTAMP),
  ('cuisine_street_food', 'Street Food', 'street-food', 8, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
