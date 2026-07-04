-- AlterTable
ALTER TABLE "merchant_applications" ADD COLUMN IF NOT EXISTS "store_logo_url" TEXT;
ALTER TABLE "merchant_applications" ADD COLUMN IF NOT EXISTS "store_banner_url" TEXT;
