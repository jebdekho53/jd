-- CreateEnum
CREATE TYPE "DeliveryProviderType" AS ENUM ('SHADOWFAX', 'PORTER', 'DELHIVERY', 'BORZO', 'OWN_FLEET');

-- CreateEnum
CREATE TYPE "ShipmentProviderStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKUP_STARTED', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "delivery_providers" (
    "id" TEXT NOT NULL,
    "type" "DeliveryProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_shipments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "delivery_id" TEXT,
    "provider_id" TEXT NOT NULL,
    "provider_type" "DeliveryProviderType" NOT NULL,
    "external_shipment_id" TEXT,
    "tracking_number" TEXT,
    "normalized_status" "ShipmentProviderStatus" NOT NULL DEFAULT 'PENDING',
    "provider_status" TEXT,
    "estimated_eta_mins" INTEGER,
    "estimated_arrival_at" TIMESTAMP(3),
    "delivery_cost" DECIMAL(10,2),
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "vehicle_type" TEXT,
    "label_url" TEXT,
    "pod_url" TEXT,
    "raw_response" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_webhooks" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_type" "DeliveryProviderType" NOT NULL,
    "event_id" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "status" "ProviderWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_tracking_events" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "provider_status" TEXT,
    "normalized_status" "ShipmentProviderStatus" NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_rate_cards" (
    "id" TEXT NOT NULL,
    "provider_type" "DeliveryProviderType" NOT NULL,
    "zone_code" TEXT,
    "base_fee" DECIMAL(10,2) NOT NULL,
    "per_km_fee" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_health" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_type" "DeliveryProviderType" NOT NULL,
    "is_healthy" BOOLEAN NOT NULL DEFAULT true,
    "latency_ms" INTEGER,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "provider_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_providers_type_key" ON "delivery_providers"("type");

-- CreateIndex
CREATE UNIQUE INDEX "provider_shipments_order_id_key" ON "provider_shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_shipments_delivery_id_key" ON "provider_shipments"("delivery_id");

-- CreateIndex
CREATE INDEX "provider_shipments_provider_type_normalized_status_idx" ON "provider_shipments"("provider_type", "normalized_status");

-- CreateIndex
CREATE INDEX "provider_shipments_external_shipment_id_idx" ON "provider_shipments"("external_shipment_id");

-- CreateIndex
CREATE INDEX "provider_shipments_tracking_number_idx" ON "provider_shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "provider_shipments_created_at_idx" ON "provider_shipments"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "provider_webhooks_provider_type_event_id_key" ON "provider_webhooks"("provider_type", "event_id");

-- CreateIndex
CREATE INDEX "provider_webhooks_provider_id_status_created_at_idx" ON "provider_webhooks"("provider_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "provider_tracking_events_shipment_id_occurred_at_idx" ON "provider_tracking_events"("shipment_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "provider_rate_cards_provider_type_is_active_idx" ON "provider_rate_cards"("provider_type", "is_active");

-- CreateIndex
CREATE INDEX "provider_health_provider_type_last_checked_at_idx" ON "provider_health"("provider_type", "last_checked_at" DESC);

-- AddForeignKey
ALTER TABLE "provider_shipments" ADD CONSTRAINT "provider_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_shipments" ADD CONSTRAINT "provider_shipments_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_shipments" ADD CONSTRAINT "provider_shipments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "delivery_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_webhooks" ADD CONSTRAINT "provider_webhooks_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "delivery_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_tracking_events" ADD CONSTRAINT "provider_tracking_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "provider_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_health" ADD CONSTRAINT "provider_health_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "delivery_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
