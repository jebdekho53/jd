-- Reverse-logistics return pickup: rider collects a returned item from the buyer.
ALTER TYPE "OrderClaimStatus" ADD VALUE IF NOT EXISTS 'RETURN_PICKUP_SCHEDULED';
ALTER TYPE "OrderClaimStatus" ADD VALUE IF NOT EXISTS 'RETURN_PICKED_UP';
ALTER TYPE "OrderClaimStatus" ADD VALUE IF NOT EXISTS 'RETURN_RECEIVED';

DO $$ BEGIN
  CREATE TYPE "ReturnPickupStatus" AS ENUM ('PENDING','ASSIGNED','ACCEPTED','PICKED_UP','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "return_pickups" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "buyer_profile_id" TEXT NOT NULL,
  "rider_profile_id" TEXT,
  "status" "ReturnPickupStatus" NOT NULL DEFAULT 'PENDING',
  "pickup_lat" DOUBLE PRECISION NOT NULL,
  "pickup_lng" DOUBLE PRECISION NOT NULL,
  "pickup_address" JSONB,
  "drop_lat" DOUBLE PRECISION,
  "drop_lng" DOUBLE PRECISION,
  "rider_earning" DECIMAL(10,2),
  "assigned_at" TIMESTAMP(3),
  "accepted_at" TIMESTAMP(3),
  "picked_up_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "return_pickups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "return_pickups_claim_id_key" ON "return_pickups"("claim_id");
CREATE INDEX IF NOT EXISTS "return_pickups_rider_profile_id_status_idx" ON "return_pickups"("rider_profile_id","status");
CREATE INDEX IF NOT EXISTS "return_pickups_store_id_status_idx" ON "return_pickups"("store_id","status");
CREATE INDEX IF NOT EXISTS "return_pickups_status_created_at_idx" ON "return_pickups"("status","created_at");

DO $$ BEGIN
  ALTER TABLE "return_pickups" ADD CONSTRAINT "return_pickups_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "order_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "return_pickups" ADD CONSTRAINT "return_pickups_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "return_pickups" ADD CONSTRAINT "return_pickups_buyer_profile_id_fkey" FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "return_pickups" ADD CONSTRAINT "return_pickups_rider_profile_id_fkey" FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
