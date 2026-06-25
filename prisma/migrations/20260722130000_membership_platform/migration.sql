-- P7.4 JebDekho Plus Membership

CREATE TYPE "MembershipBenefitType" AS ENUM ('FREE_DELIVERY', 'PRIORITY_DELIVERY', 'EXTRA_REWARDS', 'VIP_SUPPORT', 'EXCLUSIVE_OFFERS');
CREATE TYPE "MembershipSubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "yearly_price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_benefits" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "type" "MembershipBenefitType" NOT NULL,
    CONSTRAINT "membership_benefits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "buyer_profile_id" TEXT,
    "plan_id" TEXT NOT NULL,
    "status" "MembershipSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "membership_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_usages" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "benefit_type" "MembershipBenefitType" NOT NULL,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membership_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "membership_benefits_plan_id_type_key" ON "membership_benefits"("plan_id", "type");
CREATE INDEX "membership_subscriptions_user_id_status_idx" ON "membership_subscriptions"("user_id", "status");
CREATE INDEX "membership_subscriptions_expires_at_idx" ON "membership_subscriptions"("expires_at");
CREATE INDEX "membership_usages_subscription_id_created_at_idx" ON "membership_usages"("subscription_id", "created_at" DESC);

ALTER TABLE "membership_benefits" ADD CONSTRAINT "membership_benefits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_buyer_profile_id_fkey" FOREIGN KEY ("buyer_profile_id") REFERENCES "buyer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "membership_usages" ADD CONSTRAINT "membership_usages_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "membership_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_usages" ADD CONSTRAINT "membership_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
