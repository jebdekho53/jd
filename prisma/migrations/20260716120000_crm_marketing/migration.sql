-- P5.5 CRM, Marketing Automation & Growth Engine

-- Extend notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFERRAL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FINANCE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMPLIANCE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MARKETING';

ALTER TABLE "notification_templates" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'GENERAL';

CREATE TYPE "SegmentKind" AS ENUM (
  'NEW_USERS', 'ACTIVE_USERS', 'DORMANT_USERS', 'HIGH_VALUE_USERS', 'VIP_USERS',
  'WALLET_USERS', 'GOLD_MEMBERS', 'PLATINUM_MEMBERS', 'FREQUENT_BUYERS',
  'HIGH_COD_RISK', 'HIGH_REFUND_USERS', 'MERCHANT_LOYAL', 'CATEGORY_AFFINITY',
  'LOCATION_AFFINITY', 'CUSTOM'
);

CREATE TYPE "MarketingEventType" AS ENUM (
  'SEARCH', 'VIEW_PRODUCT', 'VIEW_STORE', 'ADD_CART', 'REMOVE_CART',
  'CHECKOUT_START', 'CHECKOUT_ABANDON', 'ORDER_PLACED', 'ORDER_REFUND',
  'WALLET_CREDIT', 'WALLET_DEBIT', 'REFERRAL', 'SUPPORT_TICKET',
  'CAMPAIGN_CLICK', 'CAMPAIGN_OPEN', 'NOTIFICATION_OPEN'
);

CREATE TYPE "JourneyStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "CustomerJourneyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXITED', 'PAUSED');
CREATE TYPE "JourneyExecutionStatus" AS ENUM ('SCHEDULED', 'SENT', 'SKIPPED', 'FAILED', 'CANCELLED');
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AbVariantKey" AS ENUM ('A', 'B');
CREATE TYPE "AutomationTrigger" AS ENUM (
  'CART_ABANDONED_30M', 'CART_ABANDONED_6H', 'CART_ABANDONED_24H', 'CHECKOUT_ABANDONED',
  'USER_REGISTERED', 'FIRST_ORDER', 'ORDER_DELIVERED', 'DORMANT_30D', 'BIRTHDAY',
  'LOYALTY_TIER_UP', 'REFERRAL_COMPLETED', 'CUSTOM'
);

CREATE TABLE "customer_segments" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "SegmentKind" NOT NULL,
  "description" TEXT,
  "rules" JSONB NOT NULL DEFAULT '{}',
  "is_dynamic" BOOLEAN NOT NULL DEFAULT true,
  "member_count" INTEGER NOT NULL DEFAULT 0,
  "last_refreshed_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_segments_code_key" ON "customer_segments"("code");
CREATE INDEX "customer_segments_kind_is_active_idx" ON "customer_segments"("kind", "is_active");

CREATE TABLE "customer_segment_members" (
  "segment_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_segment_members_pkey" PRIMARY KEY ("segment_id","user_id")
);
CREATE INDEX "customer_segment_members_user_id_idx" ON "customer_segment_members"("user_id");

CREATE TABLE "customer_tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_tags_name_key" ON "customer_tags"("name");

CREATE TABLE "customer_user_tags" (
  "user_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  "tagged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tagged_by" TEXT,
  CONSTRAINT "customer_user_tags_pkey" PRIMARY KEY ("user_id","tag_id")
);

CREATE TABLE "campaign_journeys" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trigger" "AutomationTrigger" NOT NULL DEFAULT 'CUSTOM',
  "status" "JourneyStatus" NOT NULL DEFAULT 'ACTIVE',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_journeys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "campaign_journeys_code_key" ON "campaign_journeys"("code");

CREATE TABLE "journey_steps" (
  "id" TEXT NOT NULL,
  "journey_id" TEXT NOT NULL,
  "step_order" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "delay_minutes" INTEGER NOT NULL DEFAULT 0,
  "channel" "NotificationChannel" NOT NULL,
  "template_code" TEXT,
  "action_config" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "journey_steps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "journey_steps_journey_id_step_order_key" ON "journey_steps"("journey_id", "step_order");

CREATE TABLE "customer_journeys" (
  "id" TEXT NOT NULL,
  "journey_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" "CustomerJourneyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "current_step" INTEGER NOT NULL DEFAULT 0,
  "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "exited_at" TIMESTAMP(3),
  CONSTRAINT "customer_journeys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_journeys_journey_id_user_id_key" ON "customer_journeys"("journey_id", "user_id");
CREATE INDEX "customer_journeys_user_id_status_idx" ON "customer_journeys"("user_id", "status");

CREATE TABLE "journey_executions" (
  "id" TEXT NOT NULL,
  "journey_id" TEXT NOT NULL,
  "step_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" "JourneyExecutionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "executed_at" TIMESTAMP(3),
  "error_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "journey_executions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "journey_executions_status_scheduled_at_idx" ON "journey_executions"("status", "scheduled_at");
CREATE INDEX "journey_executions_user_id_created_at_idx" ON "journey_executions"("user_id", "created_at" DESC);

CREATE TABLE "notification_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "push_enabled" BOOLEAN NOT NULL DEFAULT true,
  "email_enabled" BOOLEAN NOT NULL DEFAULT true,
  "sms_enabled" BOOLEAN NOT NULL DEFAULT true,
  "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
  "marketing_consent" BOOLEAN NOT NULL DEFAULT true,
  "order_updates" BOOLEAN NOT NULL DEFAULT true,
  "wallet_alerts" BOOLEAN NOT NULL DEFAULT true,
  "offer_alerts" BOOLEAN NOT NULL DEFAULT true,
  "referral_alerts" BOOLEAN NOT NULL DEFAULT true,
  "support_alerts" BOOLEAN NOT NULL DEFAULT true,
  "compliance_alerts" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

CREATE TABLE "push_campaigns" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "segment_id" TEXT, "template_code" TEXT NOT NULL,
  "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "variant_a" JSONB NOT NULL DEFAULT '{}', "variant_b" JSONB, "winner_variant" "AbVariantKey",
  "scheduled_at" TIMESTAMP(3), "sent_count" INTEGER NOT NULL DEFAULT 0, "open_count" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0, "conversion_count" INTEGER NOT NULL DEFAULT 0,
  "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "push_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "push_campaigns_status_scheduled_at_idx" ON "push_campaigns"("status", "scheduled_at");

CREATE TABLE "email_campaigns" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "segment_id" TEXT, "template_code" TEXT NOT NULL, "subject" TEXT NOT NULL,
  "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "variant_a" JSONB NOT NULL DEFAULT '{}', "variant_b" JSONB, "winner_variant" "AbVariantKey",
  "scheduled_at" TIMESTAMP(3), "sent_count" INTEGER NOT NULL DEFAULT 0, "open_count" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0, "conversion_count" INTEGER NOT NULL DEFAULT 0,
  "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_campaigns_status_scheduled_at_idx" ON "email_campaigns"("status", "scheduled_at");

CREATE TABLE "sms_campaigns" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "segment_id" TEXT, "template_code" TEXT NOT NULL,
  "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "variant_a" JSONB NOT NULL DEFAULT '{}', "variant_b" JSONB, "winner_variant" "AbVariantKey",
  "scheduled_at" TIMESTAMP(3), "sent_count" INTEGER NOT NULL DEFAULT 0, "open_count" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0, "conversion_count" INTEGER NOT NULL DEFAULT 0,
  "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sms_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sms_campaigns_status_scheduled_at_idx" ON "sms_campaigns"("status", "scheduled_at");

CREATE TABLE "whatsapp_campaigns" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "segment_id" TEXT, "template_code" TEXT NOT NULL,
  "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "variant_a" JSONB NOT NULL DEFAULT '{}', "variant_b" JSONB, "winner_variant" "AbVariantKey",
  "scheduled_at" TIMESTAMP(3), "sent_count" INTEGER NOT NULL DEFAULT 0, "open_count" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0, "conversion_count" INTEGER NOT NULL DEFAULT 0,
  "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "whatsapp_campaigns_status_scheduled_at_idx" ON "whatsapp_campaigns"("status", "scheduled_at");

CREATE TABLE "audience_rules" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "rule_type" TEXT NOT NULL, "config" JSONB NOT NULL DEFAULT '{}',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "audience_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audience_rules_rule_type_is_active_idx" ON "audience_rules"("rule_type", "is_active");

CREATE TABLE "automation_rules" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "trigger" "AutomationTrigger" NOT NULL,
  "conditions" JSONB NOT NULL DEFAULT '{}', "actions" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true, "priority" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "automation_rules_trigger_is_active_idx" ON "automation_rules"("trigger", "is_active");

CREATE TABLE "marketing_events" (
  "id" TEXT NOT NULL, "user_id" TEXT, "event_type" "MarketingEventType" NOT NULL,
  "session_id" TEXT, "store_id" TEXT, "product_id" TEXT, "order_id" TEXT, "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketing_events_user_id_created_at_idx" ON "marketing_events"("user_id", "created_at" DESC);
CREATE INDEX "marketing_events_event_type_created_at_idx" ON "marketing_events"("event_type", "created_at" DESC);
CREATE INDEX "marketing_events_session_id_idx" ON "marketing_events"("session_id");

CREATE TABLE "customer_affinities" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "affinity_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL, "entity_id" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_affinities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_affinities_user_id_affinity_type_entity_type_entity_id_key"
  ON "customer_affinities"("user_id", "affinity_type", "entity_type", "entity_id");
CREATE INDEX "customer_affinities_user_id_affinity_type_idx" ON "customer_affinities"("user_id", "affinity_type");

CREATE TABLE "recommendation_scores" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL DEFAULT 0, "reason" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recommendation_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recommendation_scores_user_id_entity_type_entity_id_key"
  ON "recommendation_scores"("user_id", "entity_type", "entity_id");
CREATE INDEX "recommendation_scores_user_id_entity_type_score_idx"
  ON "recommendation_scores"("user_id", "entity_type", "score" DESC);

-- Foreign keys
ALTER TABLE "customer_segment_members" ADD CONSTRAINT "customer_segment_members_segment_id_fkey"
  FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_segment_members" ADD CONSTRAINT "customer_segment_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_user_tags" ADD CONSTRAINT "customer_user_tags_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_user_tags" ADD CONSTRAINT "customer_user_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "customer_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journey_steps" ADD CONSTRAINT "journey_steps_journey_id_fkey"
  FOREIGN KEY ("journey_id") REFERENCES "campaign_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_journey_id_fkey"
  FOREIGN KEY ("journey_id") REFERENCES "campaign_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_journey_id_fkey"
  FOREIGN KEY ("journey_id") REFERENCES "campaign_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_step_id_fkey"
  FOREIGN KEY ("step_id") REFERENCES "journey_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_campaigns" ADD CONSTRAINT "push_campaigns_segment_id_fkey"
  FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_segment_id_fkey"
  FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_segment_id_fkey"
  FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_segment_id_fkey"
  FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_affinities" ADD CONSTRAINT "customer_affinities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_scores" ADD CONSTRAINT "recommendation_scores_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed segments
INSERT INTO "customer_segments" ("id", "code", "name", "kind", "description", "rules", "updated_at") VALUES
  ('seg_new_users', 'NEW_USERS', 'New Users', 'NEW_USERS', 'Registered in last 14 days', '{"daysSinceSignup":14}', NOW()),
  ('seg_active', 'ACTIVE_USERS', 'Active Users', 'ACTIVE_USERS', 'Ordered in last 30 days', '{"orderedWithinDays":30}', NOW()),
  ('seg_dormant', 'DORMANT_USERS', 'Dormant Users', 'DORMANT_USERS', 'No order in 60+ days', '{"noOrderDays":60}', NOW()),
  ('seg_high_value', 'HIGH_VALUE_USERS', 'High Value Users', 'HIGH_VALUE_USERS', 'LTV > 5000', '{"minLtv":5000}', NOW()),
  ('seg_vip', 'VIP_USERS', 'VIP Users', 'VIP_USERS', 'LTV > 15000', '{"minLtv":15000}', NOW()),
  ('seg_wallet', 'WALLET_USERS', 'Wallet Users', 'WALLET_USERS', 'Has wallet balance', '{"hasWallet":true}', NOW()),
  ('seg_gold', 'GOLD_MEMBERS', 'Gold Members', 'GOLD_MEMBERS', 'Gold loyalty tier', '{"tier":"GOLD"}', NOW()),
  ('seg_platinum', 'PLATINUM_MEMBERS', 'Platinum Members', 'PLATINUM_MEMBERS', 'Platinum tier', '{"tier":"PLATINUM"}', NOW()),
  ('seg_frequent', 'FREQUENT_BUYERS', 'Frequent Buyers', 'FREQUENT_BUYERS', '5+ orders in 90 days', '{"minOrders":5,"withinDays":90}', NOW()),
  ('seg_cod_risk', 'HIGH_COD_RISK', 'High COD Risk', 'HIGH_COD_RISK', 'COD disabled or high risk', '{"codDisabled":true}', NOW()),
  ('seg_refund', 'HIGH_REFUND_USERS', 'High Refund Users', 'HIGH_REFUND_USERS', '2+ refunds', '{"minRefunds":2}', NOW()),
  ('seg_merchant_loyal', 'MERCHANT_LOYAL', 'Merchant Loyal', 'MERCHANT_LOYAL', '3+ orders same store', '{"minOrdersSameStore":3}', NOW()),
  ('seg_category', 'CATEGORY_AFFINITY', 'Category Affinity', 'CATEGORY_AFFINITY', 'Top category buyers', '{"topCategory":true}', NOW()),
  ('seg_location', 'LOCATION_AFFINITY', 'Location Affinity', 'LOCATION_AFFINITY', 'Geo-clustered buyers', '{"geoCluster":true}', NOW())
ON CONFLICT ("code") DO NOTHING;

-- Seed journeys
INSERT INTO "campaign_journeys" ("id", "code", "name", "description", "trigger", "updated_at") VALUES
  ('jrn_welcome', 'WELCOME', 'Welcome Journey', 'Onboarding new users', 'USER_REGISTERED', NOW()),
  ('jrn_first_order', 'FIRST_ORDER', 'First Order Journey', 'Post first purchase', 'FIRST_ORDER', NOW()),
  ('jrn_cart_30', 'CART_ABANDON_30M', 'Cart Abandonment 30m', 'Remind after 30 minutes', 'CART_ABANDONED_30M', NOW()),
  ('jrn_cart_6h', 'CART_ABANDON_6H', 'Cart Abandonment 6h', 'Remind after 6 hours', 'CART_ABANDONED_6H', NOW()),
  ('jrn_cart_24h', 'CART_ABANDON_24H', 'Cart Abandonment 24h', 'Win-back with offer', 'CART_ABANDONED_24H', NOW()),
  ('jrn_checkout', 'CHECKOUT_ABANDON', 'Checkout Abandonment', 'Incomplete checkout', 'CHECKOUT_ABANDONED', NOW()),
  ('jrn_winback', 'DORMANT_WINBACK', 'Dormant User Winback', 'Re-engage inactive users', 'DORMANT_30D', NOW()),
  ('jrn_referral', 'REFERRAL', 'Referral Journey', 'Referral nudges', 'REFERRAL_COMPLETED', NOW()),
  ('jrn_loyalty', 'LOYALTY_UPGRADE', 'Loyalty Upgrade', 'Tier upgrade celebration', 'LOYALTY_TIER_UP', NOW()),
  ('jrn_birthday', 'BIRTHDAY', 'Birthday Journey', 'Birthday offers', 'BIRTHDAY', NOW()),
  ('jrn_festival', 'FESTIVAL', 'Festival Journey', 'Seasonal campaigns', 'CUSTOM', NOW())
ON CONFLICT ("code") DO NOTHING;

-- Seed notification templates
INSERT INTO "notification_templates" ("id", "code", "channel", "name", "category", "subject", "body", "updated_at") VALUES
  ('tpl_order_push', 'ORDER_UPDATE_PUSH', 'PUSH', 'Order Update Push', 'ORDERS', 'Order update', 'Your order {{orderNumber}} is now {{status}}.', NOW()),
  ('tpl_wallet_push', 'WALLET_CREDIT_PUSH', 'PUSH', 'Wallet Credit', 'WALLET', 'Wallet credited', '₹{{amount}} added to your wallet.', NOW()),
  ('tpl_offer_push', 'OFFER_PUSH', 'PUSH', 'Offer Alert', 'OFFERS', 'Special offer', '{{offerTitle}} — limited time only!', NOW()),
  ('tpl_cart_sms', 'CART_ABANDON_SMS', 'SMS', 'Cart Abandonment SMS', 'OFFERS', NULL, 'You left items in your cart. Complete order now: {{link}}', NOW()),
  ('tpl_referral_email', 'REFERRAL_EMAIL', 'EMAIL', 'Referral Invite', 'REFERRALS', 'Invite friends', 'Share your code {{code}} and earn rewards!', NOW()),
  ('tpl_support_inapp', 'SUPPORT_INAPP', 'IN_APP', 'Support Update', 'SUPPORT', 'Support ticket', 'Update on ticket {{ticketNumber}}.', NOW()),
  ('tpl_finance_email', 'FINANCE_EMAIL', 'EMAIL', 'Finance Notice', 'FINANCE', 'Payment update', 'Your refund of ₹{{amount}} is processed.', NOW()),
  ('tpl_compliance_sms', 'COMPLIANCE_SMS', 'SMS', 'Compliance Alert', 'COMPLIANCE', NULL, 'Important compliance notice for your account.', NOW())
ON CONFLICT ("code") DO NOTHING;

-- Seed cart recovery automation rules
INSERT INTO "automation_rules" ("id", "name", "trigger", "conditions", "actions", "updated_at") VALUES
  ('auto_cart_30', 'Cart Abandon 30min', 'CART_ABANDONED_30M', '{"delayMinutes":30}', '[{"type":"ENROLL_JOURNEY","journeyCode":"CART_ABANDON_30M"}]', NOW()),
  ('auto_cart_6h', 'Cart Abandon 6hr', 'CART_ABANDONED_6H', '{"delayMinutes":360}', '[{"type":"ENROLL_JOURNEY","journeyCode":"CART_ABANDON_6H"}]', NOW()),
  ('auto_cart_24h', 'Cart Abandon 24hr', 'CART_ABANDONED_24H', '{"delayMinutes":1440}', '[{"type":"ENROLL_JOURNEY","journeyCode":"CART_ABANDON_24H","includeOffer":true}]', NOW())
ON CONFLICT DO NOTHING;
