-- Franchise partner address + owner photo, shown on the shareable partner card.
ALTER TABLE "franchise_partners" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "franchise_partners" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
