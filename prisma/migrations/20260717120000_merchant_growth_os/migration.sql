-- P6.1 Merchant Growth OS & Store Success Platform

CREATE TYPE "MerchantGrowthAlertType" AS ENUM (
  'STORE_HEALTH_DROP',
  'VISIBILITY_DROP',
  'LOW_REPEAT_CUSTOMERS',
  'HIGH_CANCELLATION',
  'LOST_SEARCH_TRAFFIC'
);

CREATE TABLE "merchant_growth_alerts" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "alert_type" "MerchantGrowthAlertType" NOT NULL,
  "severity" "AnalyticsAlertSeverity" NOT NULL DEFAULT 'WARNING',
  "status" "AnalyticsAlertStatus" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "merchant_growth_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "merchant_growth_alerts_store_id_status_created_at_idx"
  ON "merchant_growth_alerts"("store_id", "status", "created_at" DESC);
CREATE INDEX "merchant_growth_alerts_alert_type_status_idx"
  ON "merchant_growth_alerts"("alert_type", "status");

CREATE TABLE "store_health_snapshots" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "health_score" INTEGER NOT NULL,
  "fulfillment_pct" DOUBLE PRECISION NOT NULL,
  "ratings_pct" DOUBLE PRECISION NOT NULL,
  "inventory_pct" DOUBLE PRECISION NOT NULL,
  "retention_pct" DOUBLE PRECISION NOT NULL,
  "delivery_sla_pct" DOUBLE PRECISION NOT NULL,
  "campaign_pct" DOUBLE PRECISION NOT NULL,
  "visibility_score" DOUBLE PRECISION NOT NULL,
  "snapshot_date" DATE NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_health_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_health_snapshots_store_id_snapshot_date_key"
  ON "store_health_snapshots"("store_id", "snapshot_date");
CREATE INDEX "store_health_snapshots_store_id_snapshot_date_idx"
  ON "store_health_snapshots"("store_id", "snapshot_date" DESC);

ALTER TABLE "merchant_growth_alerts" ADD CONSTRAINT "merchant_growth_alerts_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_health_snapshots" ADD CONSTRAINT "store_health_snapshots_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
