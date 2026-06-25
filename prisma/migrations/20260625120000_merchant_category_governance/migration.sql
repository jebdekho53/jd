-- CreateEnum
CREATE TYPE "MerchantCategoryStatus" AS ENUM ('PENDING', 'DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_REQUESTED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_APPROVED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_REJECTED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_DOCUMENTS_REQUIRED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_REJECTION_REVOKED';

-- CreateTable
CREATE TABLE "merchant_categories" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "status" "MerchantCategoryStatus" NOT NULL DEFAULT 'PENDING',
    "request_note" TEXT,
    "rejection_reason" TEXT,
    "document_request_reason" TEXT,
    "requested_document_types" JSONB,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_revoked_at" TIMESTAMP(3),
    "rejection_revoked_by" TEXT,
    "rejection_revoke_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_category_documents" (
    "id" TEXT NOT NULL,
    "merchant_category_id" TEXT NOT NULL,
    "document_type" "StoreDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_category_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_categories_merchant_profile_id_category_id_key" ON "merchant_categories"("merchant_profile_id", "category_id");

-- CreateIndex
CREATE INDEX "merchant_categories_merchant_profile_id_status_idx" ON "merchant_categories"("merchant_profile_id", "status");

-- CreateIndex
CREATE INDEX "merchant_categories_status_idx" ON "merchant_categories"("status");

-- CreateIndex
CREATE INDEX "merchant_category_documents_merchant_category_id_idx" ON "merchant_category_documents"("merchant_category_id");

-- AddForeignKey
ALTER TABLE "merchant_categories" ADD CONSTRAINT "merchant_categories_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_categories" ADD CONSTRAINT "merchant_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_category_documents" ADD CONSTRAINT "merchant_category_documents_merchant_category_id_fkey" FOREIGN KEY ("merchant_category_id") REFERENCES "merchant_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
