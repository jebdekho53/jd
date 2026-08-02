-- AlterTable
ALTER TABLE "offline_bill_items" ADD COLUMN     "gst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "hsn_code" TEXT,
ADD COLUMN     "taxable_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
