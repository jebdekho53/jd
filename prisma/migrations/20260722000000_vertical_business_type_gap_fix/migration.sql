-- MerchantBusinessType (what a merchant picks in onboarding) has PHARMACY, FASHION and
-- STATIONERY, but VerticalBusinessType (the store's actual sellable vertical, used for
-- discovery and catalog-kind resolution) never got these three added. Every mapping
-- function from Merchant->Vertical returned null for them, so a merchant who picked
-- Pharmacy, Fashion or Stationery had that choice silently dropped before it was even
-- written to merchant_application_business_types — no error, no store vertical, ever.
ALTER TYPE "VerticalBusinessType" ADD VALUE IF NOT EXISTS 'PHARMACY';
ALTER TYPE "VerticalBusinessType" ADD VALUE IF NOT EXISTS 'FASHION';
ALTER TYPE "VerticalBusinessType" ADD VALUE IF NOT EXISTS 'STATIONERY';
