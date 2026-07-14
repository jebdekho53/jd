-- CreateEnum
CREATE TYPE "FranchiseDocumentType" AS ENUM ('PAN_CARD', 'GST_CERTIFICATE', 'CANCELLED_CHEQUE', 'AADHAAR', 'ADDRESS_PROOF', 'SIGNED_AGREEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FranchiseDocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "franchise_partners" ADD COLUMN     "agreement_accepted_at" TIMESTAMP(3),
ADD COLUMN     "agreement_ip" TEXT,
ADD COLUMN     "agreement_version" TEXT;

-- CreateTable
CREATE TABLE "franchise_documents" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "document_type" "FranchiseDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "status" "FranchiseDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "franchise_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "franchise_documents_status_idx" ON "franchise_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_documents_franchise_id_document_type_key" ON "franchise_documents"("franchise_id", "document_type");

-- AddForeignKey
ALTER TABLE "franchise_documents" ADD CONSTRAINT "franchise_documents_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

