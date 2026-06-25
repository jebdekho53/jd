-- P7.2 Real-Time Fleet OS

CREATE TYPE "DeliveryBatchStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');
CREATE TYPE "FleetAlertType" AS ENUM ('LOW_RIDER_SUPPLY', 'ORDER_SURGE', 'SLOW_DELIVERIES', 'CLUSTER_IMBALANCE');
CREATE TYPE "FleetAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE "rider_clusters" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "active_riders" INTEGER NOT NULL DEFAULT 0,
    "active_orders" INTEGER NOT NULL DEFAULT 0,
    "demand_supply_ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rider_clusters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_batches" (
    "id" TEXT NOT NULL,
    "rider_id" TEXT NOT NULL,
    "status" "DeliveryBatchStatus" NOT NULL DEFAULT 'PLANNED',
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "delivery_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_batch_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "delivery_batch_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fleet_alerts" (
    "id" TEXT NOT NULL,
    "alert_type" "FleetAlertType" NOT NULL,
    "status" "FleetAlertStatus" NOT NULL DEFAULT 'OPEN',
    "city" TEXT,
    "locality" TEXT,
    "rider_profile_id" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "fleet_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "route_optimizations" (
    "id" TEXT NOT NULL,
    "rider_id" TEXT NOT NULL,
    "batch_id" TEXT,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "route_sequence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "route_optimizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rider_clusters_city_locality_key" ON "rider_clusters"("city", "locality");
CREATE INDEX "rider_clusters_demand_supply_ratio_idx" ON "rider_clusters"("demand_supply_ratio" DESC);
CREATE INDEX "delivery_batches_rider_id_status_idx" ON "delivery_batches"("rider_id", "status");
CREATE UNIQUE INDEX "delivery_batch_items_batch_id_order_id_key" ON "delivery_batch_items"("batch_id", "order_id");
CREATE UNIQUE INDEX "delivery_batch_items_order_id_key" ON "delivery_batch_items"("order_id");
CREATE INDEX "delivery_batch_items_batch_id_sequence_idx" ON "delivery_batch_items"("batch_id", "sequence");
CREATE INDEX "fleet_alerts_alert_type_status_idx" ON "fleet_alerts"("alert_type", "status");
CREATE INDEX "fleet_alerts_created_at_idx" ON "fleet_alerts"("created_at" DESC);
CREATE INDEX "route_optimizations_rider_id_created_at_idx" ON "route_optimizations"("rider_id", "created_at" DESC);

ALTER TABLE "delivery_batches" ADD CONSTRAINT "delivery_batches_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "rider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_batch_items" ADD CONSTRAINT "delivery_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "delivery_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_batch_items" ADD CONSTRAINT "delivery_batch_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fleet_alerts" ADD CONSTRAINT "fleet_alerts_rider_profile_id_fkey" FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "route_optimizations" ADD CONSTRAINT "route_optimizations_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "rider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_optimizations" ADD CONSTRAINT "route_optimizations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "delivery_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
