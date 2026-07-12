-- AlterTable
ALTER TABLE "merchant_profiles" ADD COLUMN     "razorpay_linked_account_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "merchant_profiles_razorpay_linked_account_id_key" ON "merchant_profiles"("razorpay_linked_account_id");

