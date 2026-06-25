-- P4.3 Campaign & Dynamic Offers

CREATE TYPE "CampaignScope" AS ENUM ('PLATFORM', 'MERCHANT');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE "OfferStackMode" AS ENUM ('BEST_OFFER', 'STACKABLE');
CREATE TYPE "OfferKind" AS ENUM (
  'FLAT_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'BUY_X_GET_Y', 'COMBO_BUNDLE',
  'CATEGORY_DISCOUNT', 'STORE_WIDE_DISCOUNT', 'FREE_DELIVERY', 'WALLET_CASHBACK',
  'REWARD_POINT_BONUS', 'FIRST_ORDER', 'HAPPY_HOUR', 'FLASH_SALE',
  'LOCALITY_BASED', 'REFERRAL_CAMPAIGN'
);
CREATE TYPE "OfferRuleType" AS ENUM (
  'HAPPY_HOUR', 'LOCALITY', 'FIRST_ORDER', 'WALLET_TIER', 'MIN_ORDER',
  'FLASH_INVENTORY', 'REFERRAL', 'CATEGORY_AFFINITY'
);
CREATE TYPE "AudienceType" AS ENUM (
  'ALL', 'NEW_USERS', 'WALLET_TIER', 'LOCALITY', 'CATEGORY_AFFINITY', 'SEARCH_HISTORY'
);
CREATE TYPE "CampaignEventType" AS ENUM ('IMPRESSION', 'CLICK', 'REDEMPTION');

CREATE TABLE "campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "scope" "CampaignScope" NOT NULL,
  "store_id" TEXT,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "stack_mode" "OfferStackMode" NOT NULL DEFAULT 'BEST_OFFER',
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "budget_cap" DECIMAL(12,2),
  "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "impression_count" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0,
  "order_count" INTEGER NOT NULL DEFAULT 0,
  "gmv_generated" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offers" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "store_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "kind" "OfferKind" NOT NULL,
  "target" "PromotionTarget" NOT NULL DEFAULT 'STORE_WIDE',
  "category_id" TEXT,
  "product_id" TEXT,
  "variant_id" TEXT,
  "discount_value" DECIMAL(10,2) NOT NULL,
  "cashback_amount" DECIMAL(10,2),
  "reward_points_bonus" INTEGER,
  "buy_quantity" INTEGER,
  "get_quantity" INTEGER,
  "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "max_discount" DECIMAL(10,2),
  "usage_limit" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "per_user_limit" INTEGER NOT NULL DEFAULT 1,
  "flash_qty_limit" INTEGER,
  "flash_qty_sold" INTEGER NOT NULL DEFAULT 0,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "paused_at" TIMESTAMP(3),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_rules" (
  "id" TEXT NOT NULL,
  "offer_id" TEXT NOT NULL,
  "rule_type" "OfferRuleType" NOT NULL,
  "config" JSONB NOT NULL,
  CONSTRAINT "offer_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_usages" (
  "id" TEXT NOT NULL,
  "offer_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "discount_applied" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "cashback_applied" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "reward_points_granted" INTEGER NOT NULL DEFAULT 0,
  "gmv_impact" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "offer_usages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaign_audiences" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "audience_type" "AudienceType" NOT NULL,
  "config" JSONB NOT NULL,
  CONSTRAINT "campaign_audiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaign_events" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "offer_id" TEXT,
  "event_type" "CampaignEventType" NOT NULL,
  "buyer_profile_id" TEXT,
  "store_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "carts" ADD COLUMN "applied_offer_id" TEXT;

CREATE UNIQUE INDEX "offer_usages_order_id_key" ON "offer_usages"("order_id");
CREATE INDEX "campaigns_scope_status_idx" ON "campaigns"("scope", "status");
CREATE INDEX "campaigns_store_id_status_idx" ON "campaigns"("store_id", "status");
CREATE INDEX "campaigns_starts_at_ends_at_idx" ON "campaigns"("starts_at", "ends_at");
CREATE INDEX "offers_campaign_id_is_active_idx" ON "offers"("campaign_id", "is_active");
CREATE INDEX "offers_store_id_is_active_idx" ON "offers"("store_id", "is_active");
CREATE INDEX "offers_kind_idx" ON "offers"("kind");
CREATE INDEX "offers_expires_at_idx" ON "offers"("expires_at");
CREATE INDEX "offer_rules_offer_id_idx" ON "offer_rules"("offer_id");
CREATE INDEX "offer_usages_offer_id_idx" ON "offer_usages"("offer_id");
CREATE INDEX "offer_usages_buyer_profile_id_idx" ON "offer_usages"("buyer_profile_id");
CREATE INDEX "campaign_audiences_campaign_id_idx" ON "campaign_audiences"("campaign_id");
CREATE INDEX "campaign_events_campaign_id_event_type_created_at_idx" ON "campaign_events"("campaign_id", "event_type", "created_at" DESC);
CREATE INDEX "campaign_events_offer_id_idx" ON "campaign_events"("offer_id");

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_rules" ADD CONSTRAINT "offer_rules_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_usages" ADD CONSTRAINT "offer_usages_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign_audiences" ADD CONSTRAINT "campaign_audiences_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_applied_offer_id_fkey" FOREIGN KEY ("applied_offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
