-- P3.4 Hyperlocal maps & geospatial intelligence

ALTER TABLE "stores" ADD COLUMN "delivery_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "stores" ADD COLUMN "locality" TEXT;

CREATE INDEX "stores_delivery_radius_km_idx" ON "stores"("delivery_radius_km");
