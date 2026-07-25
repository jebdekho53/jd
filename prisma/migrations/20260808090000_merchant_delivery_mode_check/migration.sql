-- Merchant onboarding needs to record how a store will fulfil delivery
-- (platform/Shadowfax vs self-delivery) and the result of the automated
-- same-day serviceability check that informs that default.
ALTER TABLE "merchant_applications" ADD COLUMN "delivery_mode" "StoreDeliveryMode" NOT NULL DEFAULT 'PLATFORM';
ALTER TABLE "merchant_applications" ADD COLUMN "shadowfax_serviceable" BOOLEAN;
ALTER TABLE "merchant_applications" ADD COLUMN "shadowfax_checked_at" TIMESTAMP(3);
