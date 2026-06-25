-- Dev schema repair: add columns required by P2.1 / P2.2 / P2.3 without re-running failed migrations
DO $$ BEGIN
  CREATE TYPE "OrderActorType" AS ENUM ('BUYER', 'MERCHANT', 'ADMIN', 'RIDER', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "actor_type" "OrderActorType" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "arrived_at_store_at" TIMESTAMP(3);
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "arrived_at_customer_at" TIMESTAMP(3);
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "assigned_by" TEXT;
ALTER TABLE "delivery_assignments" ADD COLUMN IF NOT EXISTS "assigned_by" TEXT;

ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "estimated_arrival_at" TIMESTAMP(3);
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "current_heading" DOUBLE PRECISION;
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "current_speed" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "delivery_tracking" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "rider_profile_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE 'PACKING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
