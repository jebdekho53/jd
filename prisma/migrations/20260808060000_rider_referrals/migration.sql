-- Rider-refers-rider program. Parallel to the buyer "referrals" table, but
-- riders have no in-app wallet, so the reward is credited via the next
-- weekly RiderPayout's incentives line (see RiderPayoutService) instead of a
-- wallet credit — hence the paid_out flag for idempotency across payout runs.

ALTER TABLE "rider_profiles" ADD COLUMN "referral_code" TEXT;
CREATE UNIQUE INDEX "rider_profiles_referral_code_key" ON "rider_profiles"("referral_code");

CREATE TABLE "rider_referrals" (
    "id" TEXT NOT NULL,
    "referrer_rider_profile_id" TEXT NOT NULL,
    "referred_rider_profile_id" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "reward_amount" DECIMAL(10,2),
    "paid_out" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rider_referrals_referred_rider_profile_id_key" ON "rider_referrals"("referred_rider_profile_id");
CREATE INDEX "rider_referrals_referrer_rider_profile_id_idx" ON "rider_referrals"("referrer_rider_profile_id");
CREATE INDEX "rider_referrals_status_idx" ON "rider_referrals"("status");

ALTER TABLE "rider_referrals" ADD CONSTRAINT "rider_referrals_referrer_rider_profile_id_fkey" FOREIGN KEY ("referrer_rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rider_referrals" ADD CONSTRAINT "rider_referrals_referred_rider_profile_id_fkey" FOREIGN KEY ("referred_rider_profile_id") REFERENCES "rider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
