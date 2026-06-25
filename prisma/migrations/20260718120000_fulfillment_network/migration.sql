-- P6.2 Dark Store, Multi-Store Network & Smart Fulfillment Engine

CREATE TYPE "StoreType" AS ENUM ('RETAIL_STORE', 'DARK_STORE', 'WAREHOUSE', 'MICRO_FULFILLMENT_CENTER');
CREATE TYPE "InventoryTransferStatus" AS ENUM ('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');
CREATE TYPE "FulfillmentOrderStatus" AS ENUM ('PENDING', 'ALLOCATED', 'PICKING', 'PACKED', 'DISPATCHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "FulfillmentAuditAction" AS ENUM ('ROUTE_SELECTED', 'SPLIT_CREATED', 'TRANSFER_REQUESTED', 'TRANSFER_APPROVED', 'TRANSFER_COMPLETED', 'CAPACITY_BLOCKED', 'REBALANCE_SUGGESTED');

ALTER TABLE "stores" ADD COLUMN "store_type" "StoreType" NOT NULL DEFAULT 'RETAIL_STORE';

ALTER TABLE "orders" ADD COLUMN "is_split_fulfillment" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "deliveries" ADD COLUMN "fulfillment_store_id" TEXT;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_fulfillment_store_id_fkey" FOREIGN KEY ("fulfillment_store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "store_networks" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "store_networks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_hubs" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "is_hub" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_hubs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fulfillment_zones" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "center_lat" DOUBLE PRECISION NOT NULL,
    "center_lng" DOUBLE PRECISION NOT NULL,
    "radius_km" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fulfillment_rules" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_transfers" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "from_store_id" TEXT NOT NULL,
    "to_store_id" TEXT NOT NULL,
    "status" "InventoryTransferStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    CONSTRAINT "inventory_transfers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transfer_items" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "transfer_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_capacity_snapshots" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "orders_per_hour" INTEGER NOT NULL DEFAULT 0,
    "pickers_available" INTEGER NOT NULL DEFAULT 0,
    "packing_stations" INTEGER NOT NULL DEFAULT 0,
    "current_load_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peak_load_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "backlog_count" INTEGER NOT NULL DEFAULT 0,
    "snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_capacity_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fulfillment_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "fulfillment_store_id" TEXT NOT NULL,
    "status" "FulfillmentOrderStatus" NOT NULL DEFAULT 'ALLOCATED',
    "eta_mins" INTEGER,
    "routing_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fulfillment_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fulfillment_order_items" (
    "id" TEXT NOT NULL,
    "fulfillment_order_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "fulfillment_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fulfillment_audits" (
    "id" TEXT NOT NULL,
    "network_id" TEXT,
    "order_id" TEXT,
    "store_id" TEXT,
    "action" "FulfillmentAuditAction" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_audits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_hubs_network_id_store_id_key" ON "store_hubs"("network_id", "store_id");
CREATE INDEX "store_hubs_store_id_idx" ON "store_hubs"("store_id");
CREATE INDEX "store_networks_merchant_profile_id_is_active_idx" ON "store_networks"("merchant_profile_id", "is_active");
CREATE INDEX "fulfillment_zones_network_id_is_active_idx" ON "fulfillment_zones"("network_id", "is_active");
CREATE INDEX "fulfillment_rules_network_id_is_active_priority_idx" ON "fulfillment_rules"("network_id", "is_active", "priority");
CREATE INDEX "inventory_transfers_merchant_profile_id_status_requested_at_idx" ON "inventory_transfers"("merchant_profile_id", "status", "requested_at" DESC);
CREATE INDEX "inventory_transfers_from_store_id_status_idx" ON "inventory_transfers"("from_store_id", "status");
CREATE INDEX "inventory_transfers_to_store_id_status_idx" ON "inventory_transfers"("to_store_id", "status");
CREATE INDEX "transfer_items_transfer_id_idx" ON "transfer_items"("transfer_id");
CREATE INDEX "store_capacity_snapshots_store_id_snapshot_at_idx" ON "store_capacity_snapshots"("store_id", "snapshot_at" DESC);
CREATE INDEX "fulfillment_orders_order_id_idx" ON "fulfillment_orders"("order_id");
CREATE INDEX "fulfillment_orders_fulfillment_store_id_status_idx" ON "fulfillment_orders"("fulfillment_store_id", "status");
CREATE INDEX "fulfillment_order_items_fulfillment_order_id_idx" ON "fulfillment_order_items"("fulfillment_order_id");
CREATE INDEX "fulfillment_audits_order_id_created_at_idx" ON "fulfillment_audits"("order_id", "created_at" DESC);
CREATE INDEX "fulfillment_audits_network_id_action_created_at_idx" ON "fulfillment_audits"("network_id", "action", "created_at" DESC);

ALTER TABLE "store_networks" ADD CONSTRAINT "store_networks_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_hubs" ADD CONSTRAINT "store_hubs_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "store_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_hubs" ADD CONSTRAINT "store_hubs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_zones" ADD CONSTRAINT "fulfillment_zones_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "store_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_rules" ADD CONSTRAINT "fulfillment_rules_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "store_networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_from_store_id_fkey" FOREIGN KEY ("from_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_to_store_id_fkey" FOREIGN KEY ("to_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "inventory_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_capacity_snapshots" ADD CONSTRAINT "store_capacity_snapshots_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_orders" ADD CONSTRAINT "fulfillment_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_orders" ADD CONSTRAINT "fulfillment_orders_fulfillment_store_id_fkey" FOREIGN KEY ("fulfillment_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fulfillment_order_items" ADD CONSTRAINT "fulfillment_order_items_fulfillment_order_id_fkey" FOREIGN KEY ("fulfillment_order_id") REFERENCES "fulfillment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_order_items" ADD CONSTRAINT "fulfillment_order_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fulfillment_order_items" ADD CONSTRAINT "fulfillment_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fulfillment_audits" ADD CONSTRAINT "fulfillment_audits_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "store_networks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillment_audits" ADD CONSTRAINT "fulfillment_audits_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillment_audits" ADD CONSTRAINT "fulfillment_audits_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
