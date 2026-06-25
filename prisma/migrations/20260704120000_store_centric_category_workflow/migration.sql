-- P3.1 store-centric category workflow: UNDER_REVIEW, REVOKED, request documents

ALTER TYPE "StoreCategoryRequestStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "StoreCategoryRequestStatus" ADD VALUE IF NOT EXISTS 'REVOKED';

CREATE TABLE "store_category_request_documents" (
    "id" TEXT NOT NULL,
    "store_category_request_id" TEXT NOT NULL,
    "document_type" "StoreDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_category_request_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "store_category_request_documents_store_category_request_id_idx"
    ON "store_category_request_documents"("store_category_request_id");

ALTER TABLE "store_category_request_documents" ADD CONSTRAINT "store_category_request_documents_store_category_request_id_fkey"
    FOREIGN KEY ("store_category_request_id") REFERENCES "store_category_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
