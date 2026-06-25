-- P2.4 Live Delivery Tracking

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

CREATE INDEX IF NOT EXISTS "delivery_tracking_delivery_id_recorded_at_idx"
    ON "delivery_tracking"("delivery_id", "recorded_at" DESC);
CREATE INDEX IF NOT EXISTS "delivery_tracking_rider_profile_id_recorded_at_idx"
    ON "delivery_tracking"("rider_profile_id", "recorded_at" DESC);
CREATE INDEX IF NOT EXISTS "delivery_tracking_recorded_at_idx"
    ON "delivery_tracking"("recorded_at");

DO $$ BEGIN
    ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_delivery_id_fkey"
        FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_rider_profile_id_fkey"
        FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
