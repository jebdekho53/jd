-- Lets self-delivery merchants set their own distance-banded delivery fee
-- (e.g. 0-3km, 3-5km, 5-9km) instead of the flat platform fee.
ALTER TABLE "stores" ADD COLUMN "self_delivery_fee_tiers" JSONB;
