-- Delivery handover verification (pickup + delivery OTP).
-- Backwards-compatible: all columns are nullable or defaulted, so existing
-- rows (including completed deliveries) remain valid without a backfill.
ALTER TABLE "deliveries"
  ADD COLUMN "pickup_otp" TEXT,
  ADD COLUMN "pickup_verified_at" TIMESTAMP(3),
  ADD COLUMN "pickup_otp_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "delivery_otp" TEXT,
  ADD COLUMN "delivery_verified_at" TIMESTAMP(3),
  ADD COLUMN "delivery_otp_attempts" INTEGER NOT NULL DEFAULT 0;
