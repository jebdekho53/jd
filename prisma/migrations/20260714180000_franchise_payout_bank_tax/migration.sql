-- CreateEnum
CREATE TYPE "FranchisePayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- AlterTable
ALTER TABLE "franchise_settlements" ADD COLUMN     "gst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "invoice_number" TEXT,
ADD COLUMN     "net_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tds_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tds_percent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "franchise_bank_accounts" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "bank_name" TEXT,
    "upi_id" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "razorpay_linked_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "franchise_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franchise_payouts" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "settlement_id" TEXT NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "gst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tds_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "status" "FranchisePayoutStatus" NOT NULL DEFAULT 'PENDING',
    "razorpay_transfer_id" TEXT,
    "utr" TEXT,
    "bank_snapshot" JSONB,
    "failure_reason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "franchise_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "franchise_bank_accounts_franchise_id_key" ON "franchise_bank_accounts"("franchise_id");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_bank_accounts_razorpay_linked_account_id_key" ON "franchise_bank_accounts"("razorpay_linked_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_payouts_settlement_id_key" ON "franchise_payouts"("settlement_id");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_payouts_razorpay_transfer_id_key" ON "franchise_payouts"("razorpay_transfer_id");

-- CreateIndex
CREATE INDEX "franchise_payouts_franchise_id_status_idx" ON "franchise_payouts"("franchise_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_settlements_invoice_number_key" ON "franchise_settlements"("invoice_number");

-- AddForeignKey
ALTER TABLE "franchise_bank_accounts" ADD CONSTRAINT "franchise_bank_accounts_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "franchise_payouts" ADD CONSTRAINT "franchise_payouts_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "franchise_payouts" ADD CONSTRAINT "franchise_payouts_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "franchise_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

