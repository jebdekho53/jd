-- AlterEnum: StoreStatus
ALTER TYPE "StoreStatus" ADD VALUE IF NOT EXISTS 'DOCUMENTS_REQUIRED';
ALTER TYPE "StoreStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

-- CreateEnum
CREATE TYPE "StoreDocumentType" AS ENUM ('GST_CERTIFICATE', 'PAN_CARD', 'FSSAI_LICENSE', 'TRADE_LICENSE', 'BANK_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "MerchantBlocklistType" AS ENUM ('PHONE', 'EMAIL', 'GST_NUMBER', 'PAN_NUMBER');

-- AlterEnum: DomainEventType
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'STORE_DOCUMENTS_REQUESTED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'STORE_DOCUMENTS_SUBMITTED';

-- AlterTable
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "document_request_reason" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "document_request_at" TIMESTAMP(3);
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "document_request_by" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "requested_document_types" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "store_document_requests" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "document_types" JSONB NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilled_at" TIMESTAMP(3),

    CONSTRAINT "store_document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "store_verification_documents" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "document_type" "StoreDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "merchant_verification_blocklist" (
    "id" TEXT NOT NULL,
    "type" "MerchantBlocklistType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "store_id" TEXT,
    "blocked_by" TEXT NOT NULL,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_verification_blocklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "store_document_requests_store_id_requested_at_idx" ON "store_document_requests"("store_id", "requested_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "store_verification_documents_store_id_document_type_idx" ON "store_verification_documents"("store_id", "document_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "merchant_verification_blocklist_value_idx" ON "merchant_verification_blocklist"("value");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_verification_blocklist_type_value_key" ON "merchant_verification_blocklist"("type", "value");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "store_document_requests" ADD CONSTRAINT "store_document_requests_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "store_verification_documents" ADD CONSTRAINT "store_verification_documents_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
