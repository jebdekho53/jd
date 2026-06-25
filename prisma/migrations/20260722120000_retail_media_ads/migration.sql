-- P7.3 Retail Media & Advertising

CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "AdPlacement" AS ENUM ('SEARCH', 'HOME', 'CATEGORY');

CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budget" DECIMAL(14,2) NOT NULL,
    "spent_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_groups" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "bid_amount" DECIMAL(10,2) NOT NULL,
    "daily_budget" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ad_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sponsored_products" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sponsored_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sponsored_stores" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sponsored_stores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "keyword_bids" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "bid_amount" DECIMAL(10,2) NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "keyword_bids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_impressions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT,
    "placement" "AdPlacement" NOT NULL,
    "cost" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_clicks" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT,
    "cost" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_clicks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_conversions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_conversions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sponsored_products_campaign_id_product_id_key" ON "sponsored_products"("campaign_id", "product_id");
CREATE INDEX "sponsored_products_product_id_priority_idx" ON "sponsored_products"("product_id", "priority" DESC);
CREATE UNIQUE INDEX "sponsored_stores_campaign_id_store_id_key" ON "sponsored_stores"("campaign_id", "store_id");
CREATE INDEX "sponsored_stores_store_id_priority_idx" ON "sponsored_stores"("store_id", "priority" DESC);
CREATE UNIQUE INDEX "keyword_bids_campaign_id_keyword_key" ON "keyword_bids"("campaign_id", "keyword");
CREATE INDEX "keyword_bids_keyword_idx" ON "keyword_bids"("keyword");
CREATE INDEX "ad_campaigns_advertiser_id_status_idx" ON "ad_campaigns"("advertiser_id", "status");
CREATE INDEX "ad_impressions_campaign_id_created_at_idx" ON "ad_impressions"("campaign_id", "created_at" DESC);
CREATE UNIQUE INDEX "ad_conversions_order_id_campaign_id_key" ON "ad_conversions"("order_id", "campaign_id");

ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_groups" ADD CONSTRAINT "ad_groups_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_products" ADD CONSTRAINT "sponsored_products_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_products" ADD CONSTRAINT "sponsored_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_stores" ADD CONSTRAINT "sponsored_stores_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_stores" ADD CONSTRAINT "sponsored_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "keyword_bids" ADD CONSTRAINT "keyword_bids_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ad_conversions" ADD CONSTRAINT "ad_conversions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_conversions" ADD CONSTRAINT "ad_conversions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
