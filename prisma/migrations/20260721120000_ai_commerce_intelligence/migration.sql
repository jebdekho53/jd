-- P7.1 AI Commerce Intelligence

CREATE TYPE "AIRecommendationEntityType" AS ENUM ('STORE', 'PRODUCT', 'MERCHANT', 'CAMPAIGN');
CREATE TYPE "AIRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "PricingRecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED');
CREATE TYPE "InventoryForecastUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "demand_forecasts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "forecast_date" DATE NOT NULL,
    "predicted_demand" INTEGER NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "actual_demand" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_forecasts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "days_until_stockout" INTEGER NOT NULL,
    "recommended_qty" INTEGER NOT NULL,
    "urgency" "InventoryForecastUrgency" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_forecasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_recommendations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "current_price" DECIMAL(10,2) NOT NULL,
    "recommended_price" DECIMAL(10,2) NOT NULL,
    "expected_lift_percent" DOUBLE PRECISION NOT NULL,
    "status" "PricingRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "demand_hotspots" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "category_id" TEXT,
    "demand_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "demand_hotspots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "entity_type" "AIRecommendationEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "AIRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "demand_forecasts_store_id_product_id_forecast_date_key" ON "demand_forecasts"("store_id", "product_id", "forecast_date");
CREATE INDEX "demand_forecasts_forecast_date_idx" ON "demand_forecasts"("forecast_date");
CREATE UNIQUE INDEX "inventory_forecasts_store_id_product_id_key" ON "inventory_forecasts"("store_id", "product_id");
CREATE INDEX "inventory_forecasts_urgency_idx" ON "inventory_forecasts"("urgency");
CREATE INDEX "pricing_recommendations_store_id_status_idx" ON "pricing_recommendations"("store_id", "status");
CREATE UNIQUE INDEX "demand_hotspots_city_locality_category_id_key" ON "demand_hotspots"("city", "locality", "category_id");
CREATE INDEX "demand_hotspots_demand_score_idx" ON "demand_hotspots"("demand_score" DESC);
CREATE INDEX "ai_recommendations_entity_type_entity_id_idx" ON "ai_recommendations"("entity_type", "entity_id");
CREATE INDEX "ai_recommendations_priority_created_at_idx" ON "ai_recommendations"("priority", "created_at" DESC);

ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_forecasts" ADD CONSTRAINT "inventory_forecasts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_forecasts" ADD CONSTRAINT "inventory_forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_recommendations" ADD CONSTRAINT "pricing_recommendations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_recommendations" ADD CONSTRAINT "pricing_recommendations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_hotspots" ADD CONSTRAINT "demand_hotspots_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
