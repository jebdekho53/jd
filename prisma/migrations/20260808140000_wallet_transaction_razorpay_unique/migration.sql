-- Verified before writing this migration: only 82 rows total in
-- merchant_ai_wallet_transactions, 1 non-null razorpay_order_id and 1
-- non-null razorpay_payment_id, zero duplicate values on either column
-- (checked via a read-only Prisma groupBy against production). Safe to
-- add uniqueness without a reconciliation step.
--
-- Prevents a webhook retry (or two independent recharge attempts that
-- happen to reuse a Razorpay order/payment id) from double-crediting a
-- merchant's AI wallet — previously only the client-generated
-- idempotency_key guarded against duplicates, and a client sending two
-- different idempotency keys for the same actual Razorpay charge would
-- not have been caught.

-- DropIndex
DROP INDEX "merchant_ai_wallet_transactions_razorpay_order_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "merchant_ai_wallet_transactions_razorpay_order_id_key" ON "merchant_ai_wallet_transactions"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_ai_wallet_transactions_razorpay_payment_id_key" ON "merchant_ai_wallet_transactions"("razorpay_payment_id");
