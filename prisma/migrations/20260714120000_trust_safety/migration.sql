-- P5.3 Enterprise Risk, Fraud Detection, Trust & Safety Platform

CREATE TYPE "RiskProfileStatus" AS ENUM ('CLEAR', 'WATCHLIST', 'REVIEW', 'BLOCKED');
CREATE TYPE "FraudCaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "FraudCaseCategory" AS ENUM (
  'REFERRAL_ABUSE', 'WALLET_ABUSE', 'COUPON_ABUSE', 'COD_ABUSE', 'RIDER_FRAUD',
  'MERCHANT_FRAUD', 'ACCOUNT_TAKEOVER', 'BOT_TRAFFIC', 'LOCATION_SPOOFING', 'ORDER_FRAUD', 'OTHER'
);
CREATE TYPE "FraudDecisionAction" AS ENUM (
  'ALLOW', 'WARN', 'SOFT_BLOCK', 'HARD_BLOCK', 'WALLET_FREEZE', 'REFERRAL_FREEZE',
  'COUPON_FREEZE', 'COD_DISABLE', 'MERCHANT_SUSPEND', 'RIDER_SUSPEND', 'RESTRICT', 'BLACKLIST'
);
CREATE TYPE "AccountRestrictionType" AS ENUM (
  'SOFT_BLOCK', 'HARD_BLOCK', 'WALLET_FREEZE', 'REFERRAL_FREEZE', 'COUPON_FREEZE',
  'COD_DISABLE', 'MERCHANT_SUSPEND', 'RIDER_SUSPEND'
);
CREATE TYPE "TrustAlertType" AS ENUM (
  'FRAUD_SPIKE', 'REFERRAL_ABUSE', 'WALLET_ABUSE', 'COD_ABUSE',
  'RIDER_ANOMALY', 'MERCHANT_ANOMALY', 'ACCOUNT_TAKEOVER', 'BOT_TRAFFIC'
);

ALTER TABLE "otp_verifications" ADD COLUMN "ip_address" TEXT;
ALTER TABLE "otp_verifications" ADD COLUMN "device_id" TEXT;
ALTER TABLE "otp_verifications" ADD COLUMN "user_agent" TEXT;

ALTER TABLE "buyer_profiles" ADD COLUMN "cod_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "risk_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RiskProfileStatus" NOT NULL DEFAULT 'CLEAR',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "trust_score" INTEGER NOT NULL DEFAULT 100,
    "fraud_score" INTEGER NOT NULL DEFAULT 0,
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "wallet_frozen" BOOLEAN NOT NULL DEFAULT false,
    "referral_frozen" BOOLEAN NOT NULL DEFAULT false,
    "coupon_frozen" BOOLEAN NOT NULL DEFAULT false,
    "last_evaluated_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "risk_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "subject_type" TEXT,
    "subject_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fraud_cases" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "user_id" TEXT,
    "category" "FraudCaseCategory" NOT NULL,
    "status" "FraudCaseStatus" NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject_type" TEXT,
    "subject_id" TEXT,
    "idempotency_key" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fraud_rules" (
    "id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FraudCaseCategory" NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 10,
    "config" JSONB,
    "action" "FraudDecisionAction" NOT NULL DEFAULT 'WARN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fraud_decisions" (
    "id" TEXT NOT NULL,
    "fraud_case_id" TEXT,
    "fraud_rule_id" TEXT,
    "user_id" TEXT,
    "decision" "FraudDecisionAction" NOT NULL,
    "action_taken" BOOLEAN NOT NULL DEFAULT false,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "device_fingerprints" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "device_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "os" TEXT,
    "city" TEXT,
    "state" TEXT,
    "account_count" INTEGER NOT NULL DEFAULT 1,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "device_fingerprint_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_new_device" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "geo_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "order_id" TEXT,
    "rider_profile_id" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "flags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geo_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account_restrictions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "restriction_type" "AccountRestrictionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "applied_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "lifted_at" TIMESTAMP(3),
    "lifted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_restrictions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_alerts" (
    "id" TEXT NOT NULL,
    "alert_type" "TrustAlertType" NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "trust_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "risk_profiles_user_id_key" ON "risk_profiles"("user_id");
CREATE UNIQUE INDEX "risk_events_idempotency_key_key" ON "risk_events"("idempotency_key");
CREATE UNIQUE INDEX "fraud_cases_case_number_key" ON "fraud_cases"("case_number");
CREATE UNIQUE INDEX "fraud_cases_idempotency_key_key" ON "fraud_cases"("idempotency_key");
CREATE UNIQUE INDEX "fraud_rules_rule_code_key" ON "fraud_rules"("rule_code");
CREATE UNIQUE INDEX "fraud_decisions_idempotency_key_key" ON "fraud_decisions"("idempotency_key");
CREATE UNIQUE INDEX "device_fingerprints_device_id_fingerprint_key" ON "device_fingerprints"("device_id", "fingerprint");
CREATE UNIQUE INDEX "login_sessions_session_token_key" ON "login_sessions"("session_token");

CREATE INDEX "risk_profiles_status_idx" ON "risk_profiles"("status");
CREATE INDEX "risk_profiles_risk_score_idx" ON "risk_profiles"("risk_score" DESC);
CREATE INDEX "risk_events_user_id_created_at_idx" ON "risk_events"("user_id", "created_at" DESC);
CREATE INDEX "risk_events_event_type_created_at_idx" ON "risk_events"("event_type", "created_at" DESC);
CREATE INDEX "fraud_cases_status_created_at_idx" ON "fraud_cases"("status", "created_at" DESC);
CREATE INDEX "fraud_cases_category_status_idx" ON "fraud_cases"("category", "status");
CREATE INDEX "fraud_cases_user_id_idx" ON "fraud_cases"("user_id");
CREATE INDEX "fraud_decisions_fraud_case_id_idx" ON "fraud_decisions"("fraud_case_id");
CREATE INDEX "fraud_decisions_user_id_created_at_idx" ON "fraud_decisions"("user_id", "created_at" DESC);
CREATE INDEX "device_fingerprints_fingerprint_idx" ON "device_fingerprints"("fingerprint");
CREATE INDEX "device_fingerprints_ip_address_idx" ON "device_fingerprints"("ip_address");
CREATE INDEX "device_fingerprints_user_id_idx" ON "device_fingerprints"("user_id");
CREATE INDEX "login_sessions_user_id_created_at_idx" ON "login_sessions"("user_id", "created_at" DESC);
CREATE INDEX "geo_verifications_user_id_created_at_idx" ON "geo_verifications"("user_id", "created_at" DESC);
CREATE INDEX "geo_verifications_order_id_idx" ON "geo_verifications"("order_id");
CREATE INDEX "account_restrictions_user_id_active_idx" ON "account_restrictions"("user_id", "active");
CREATE INDEX "account_restrictions_restriction_type_active_idx" ON "account_restrictions"("restriction_type", "active");
CREATE INDEX "trust_alerts_status_created_at_idx" ON "trust_alerts"("status", "created_at" DESC);
CREATE INDEX "trust_alerts_alert_type_created_at_idx" ON "trust_alerts"("alert_type", "created_at" DESC);

ALTER TABLE "risk_profiles" ADD CONSTRAINT "risk_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fraud_cases" ADD CONSTRAINT "fraud_cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fraud_decisions" ADD CONSTRAINT "fraud_decisions_fraud_case_id_fkey" FOREIGN KEY ("fraud_case_id") REFERENCES "fraud_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fraud_decisions" ADD CONSTRAINT "fraud_decisions_fraud_rule_id_fkey" FOREIGN KEY ("fraud_rule_id") REFERENCES "fraud_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_device_fingerprint_id_fkey" FOREIGN KEY ("device_fingerprint_id") REFERENCES "device_fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "geo_verifications" ADD CONSTRAINT "geo_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "account_restrictions" ADD CONSTRAINT "account_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "fraud_rules" ("id", "rule_code", "name", "category", "description", "weight", "action", "config", "updated_at") VALUES
  ('fr_self_referral', 'SELF_REFERRAL', 'Self referral', 'REFERRAL_ABUSE', 'User applied own referral code', 40, 'HARD_BLOCK', '{}', NOW()),
  ('fr_device_referral', 'SAME_DEVICE_REFERRAL', 'Same device referral', 'REFERRAL_ABUSE', 'Referrer and referee share device', 35, 'REFERRAL_FREEZE', '{"maxAccountsPerDevice":3}', NOW()),
  ('fr_ip_referral', 'SAME_IP_REFERRAL', 'Same IP referral', 'REFERRAL_ABUSE', 'Referrer and referee share IP', 25, 'WARN', '{}', NOW()),
  ('fr_wallet_credit', 'SUSPICIOUS_WALLET_CREDIT', 'Large wallet credit', 'WALLET_ABUSE', 'Abnormal wallet credit amount', 20, 'WALLET_FREEZE', '{"thresholdInr":500}', NOW()),
  ('fr_coupon_device', 'COUPON_SAME_DEVICE', 'Coupon same device abuse', 'COUPON_ABUSE', 'Multiple accounts redeeming on same device', 30, 'COUPON_FREEZE', '{}', NOW()),
  ('fr_cod_high_risk', 'COD_HIGH_RISK_BUYER', 'High-risk COD buyer', 'COD_ABUSE', 'Buyer COD abuse patterns', 35, 'COD_DISABLE', '{"minRiskScore":60}', NOW()),
  ('fr_rider_gps', 'RIDER_GPS_SPOOF', 'Rider GPS spoofing', 'RIDER_FRAUD', 'Impossible travel speed detected', 40, 'RIDER_SUSPEND', '{"maxSpeedKmh":120}', NOW()),
  ('fr_merchant_fake', 'MERCHANT_FAKE_ORDERS', 'Merchant fake orders', 'MERCHANT_FRAUD', 'Suspicious order inflation', 35, 'MERCHANT_SUSPEND', '{}', NOW()),
  ('fr_new_device', 'NEW_DEVICE_LOGIN', 'New device login', 'ACCOUNT_TAKEOVER', 'Login from unrecognized device', 15, 'WARN', '{}', NOW()),
  ('fr_bot_otp', 'OTP_VELOCITY', 'OTP velocity abuse', 'BOT_TRAFFIC', 'Excessive OTP requests', 25, 'SOFT_BLOCK', '{"maxPerHour":10}', NOW());
