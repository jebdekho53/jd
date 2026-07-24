-- Distinguish "hidden because FSSAI licence missing" (system-held, auto-released
-- once the licence is on file) from "hidden because the merchant marked it sold
-- out" (deliberate, must never be silently auto-released). Both previously
-- shared the same HIDDEN availability value with no way to tell them apart,
-- so the FSSAI auto-release sweep was flipping merchant-marked sold-out dishes
-- back to AVAILABLE on the very next menu fetch.
ALTER TABLE "restaurant_menu_items" ADD COLUMN "fssai_held" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any item currently HIDDEN was, until now, only ever hidden by the
-- FSSAI-hold mechanism (the sold-out toggle didn't exist before this migration).
UPDATE "restaurant_menu_items" SET "fssai_held" = true WHERE "availability" = 'HIDDEN';
