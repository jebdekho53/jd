-- Owner's photo for the shareable merchant marketing card (distinct from store logo).
-- Additive, nullable — existing applications keep working, card falls back to the logo.
ALTER TABLE "merchant_applications" ADD COLUMN     "owner_photo_url" TEXT;
