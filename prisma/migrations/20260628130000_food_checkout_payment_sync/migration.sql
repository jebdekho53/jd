-- Food checkout payment sync fields
ALTER TABLE "food_checkouts" ADD COLUMN IF NOT EXISTS "razorpay_order_id" TEXT;
ALTER TABLE "food_checkouts" ADD COLUMN IF NOT EXISTS "cart_snapshot" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "food_checkouts_razorpay_order_id_key" ON "food_checkouts"("razorpay_order_id");
