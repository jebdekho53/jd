-- P5.4 Enterprise Customer Support, CRM & Resolution Center

CREATE TYPE "SupportChannel" AS ENUM ('CHAT', 'EMAIL', 'PHONE', 'WHATSAPP', 'IN_APP');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "SupportActorType" AS ENUM ('BUYER', 'MERCHANT', 'RIDER', 'ADMIN', 'SYSTEM');
CREATE TYPE "SupportTeam" AS ENUM ('CUSTOMER_SUPPORT', 'FINANCE', 'MERCHANT_OPS', 'RIDER_OPS', 'COMPLIANCE');
CREATE TYPE "SupportMessageVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "HelpArticleKind" AS ENUM ('FAQ', 'GUIDE', 'POLICY');

CREATE TABLE "support_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience" "SupportActorType" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_slas" (
    "id" TEXT NOT NULL,
    "priority" "SupportPriority" NOT NULL,
    "response_minutes" INTEGER NOT NULL,
    "resolution_minutes" INTEGER NOT NULL,
    "escalation_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_slas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_agents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team" "SupportTeam" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_agents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_ticket_sequences" (
    "id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "support_ticket_sequences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "actor_type" "SupportActorType" NOT NULL,
    "channel" "SupportChannel" NOT NULL DEFAULT 'IN_APP',
    "category_id" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_id" TEXT,
    "payment_id" TEXT,
    "wallet_transaction_id" TEXT,
    "gst_invoice_id" TEXT,
    "is_refund_dispute" BOOLEAN NOT NULL DEFAULT false,
    "assigned_team" "SupportTeam",
    "first_response_at" TIMESTAMP(3),
    "sla_response_due" TIMESTAMP(3),
    "sla_resolution_due" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "SupportMessageVisibility" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "message_id" TEXT,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_assignments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    CONSTRAINT "support_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_resolutions" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "resolved_by" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "refund_approved" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_resolutions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_escalations" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_priority" "SupportPriority" NOT NULL,
    "to_priority" "SupportPriority" NOT NULL,
    "reason" TEXT NOT NULL,
    "escalated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_escalations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_feedbacks" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_macros" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "team" "SupportTeam",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_macros_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_ticket_tags" (
    "ticket_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "support_ticket_tags_pkey" PRIMARY KEY ("ticket_id","tag_id")
);

CREATE TABLE "help_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" "HelpArticleKind" NOT NULL DEFAULT 'FAQ',
    "category" TEXT NOT NULL,
    "audience" "SupportActorType" NOT NULL DEFAULT 'BUYER',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_categories_code_key" ON "support_categories"("code");
CREATE UNIQUE INDEX "support_slas_priority_key" ON "support_slas"("priority");
CREATE UNIQUE INDEX "support_agents_user_id_key" ON "support_agents"("user_id");
CREATE UNIQUE INDEX "support_ticket_sequences_period_key_key" ON "support_ticket_sequences"("period_key");
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");
CREATE UNIQUE INDEX "support_resolutions_ticket_id_key" ON "support_resolutions"("ticket_id");
CREATE UNIQUE INDEX "support_feedbacks_ticket_id_key" ON "support_feedbacks"("ticket_id");
CREATE UNIQUE INDEX "support_tags_name_key" ON "support_tags"("name");
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");

CREATE INDEX "support_agents_team_is_active_idx" ON "support_agents"("team", "is_active");
CREATE INDEX "support_tickets_status_priority_created_at_idx" ON "support_tickets"("status", "priority", "created_at" DESC);
CREATE INDEX "support_tickets_requester_user_id_created_at_idx" ON "support_tickets"("requester_user_id", "created_at" DESC);
CREATE INDEX "support_tickets_assigned_team_status_idx" ON "support_tickets"("assigned_team", "status");
CREATE INDEX "support_tickets_is_refund_dispute_status_idx" ON "support_tickets"("is_refund_dispute", "status");
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "support_messages"("ticket_id", "created_at");
CREATE INDEX "support_attachments_ticket_id_idx" ON "support_attachments"("ticket_id");
CREATE INDEX "support_assignments_ticket_id_is_active_idx" ON "support_assignments"("ticket_id", "is_active");
CREATE INDEX "support_assignments_agent_id_is_active_idx" ON "support_assignments"("agent_id", "is_active");
CREATE INDEX "support_escalations_ticket_id_created_at_idx" ON "support_escalations"("ticket_id", "created_at" DESC);
CREATE INDEX "help_articles_category_is_published_idx" ON "help_articles"("category", "is_published");
CREATE INDEX "help_articles_audience_is_published_idx" ON "help_articles"("audience", "is_published");

ALTER TABLE "support_agents" ADD CONSTRAINT "support_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "support_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "support_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_assignments" ADD CONSTRAINT "support_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_assignments" ADD CONSTRAINT "support_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "support_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_resolutions" ADD CONSTRAINT "support_resolutions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_escalations" ADD CONSTRAINT "support_escalations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_feedbacks" ADD CONSTRAINT "support_feedbacks_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_tags" ADD CONSTRAINT "support_ticket_tags_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_tags" ADD CONSTRAINT "support_ticket_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "support_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "support_slas" ("id", "priority", "response_minutes", "resolution_minutes", "escalation_minutes", "updated_at") VALUES
  ('sla_low', 'LOW', 480, 2880, 1440, NOW()),
  ('sla_medium', 'MEDIUM', 240, 1440, 720, NOW()),
  ('sla_high', 'HIGH', 60, 480, 240, NOW()),
  ('sla_critical', 'CRITICAL', 15, 120, 60, NOW());

INSERT INTO "support_categories" ("id", "code", "name", "audience", "description", "sort_order") VALUES
  ('sc_order', 'ORDER_ISSUE', 'Order Issues', 'BUYER', 'Problems with orders', 1),
  ('sc_refund', 'REFUND_ISSUE', 'Refund Issues', 'BUYER', 'Refund and returns', 2),
  ('sc_payment', 'PAYMENT_PROBLEM', 'Payment Problems', 'BUYER', 'Payment failures', 3),
  ('sc_wallet', 'WALLET_ISSUE', 'Wallet Issues', 'BUYER', 'Wallet balance and credits', 4),
  ('sc_delivery', 'DELIVERY_PROBLEM', 'Delivery Problems', 'BUYER', 'Late or missing delivery', 5),
  ('sc_quality', 'PRODUCT_QUALITY', 'Product Quality', 'BUYER', 'Product quality complaints', 6),
  ('sc_merchant', 'MERCHANT_COMPLAINT', 'Merchant Complaint', 'BUYER', 'Store behaviour', 7),
  ('sc_account', 'ACCOUNT_ISSUE', 'Account Issues', 'BUYER', 'Login and profile', 8),
  ('sc_m_settlement', 'SETTLEMENT_ISSUE', 'Settlement Issues', 'MERCHANT', 'Payout and settlement', 10),
  ('sc_m_payout', 'PAYOUT_DELAY', 'Payout Delays', 'MERCHANT', 'Delayed payouts', 11),
  ('sc_m_inventory', 'INVENTORY_ISSUE', 'Inventory Issues', 'MERCHANT', 'Stock sync problems', 12),
  ('sc_m_verify', 'STORE_VERIFICATION', 'Store Verification', 'MERCHANT', 'KYC and verification', 13),
  ('sc_m_campaign', 'CAMPAIGN_PROBLEM', 'Campaign Problems', 'MERCHANT', 'Promotions and offers', 14),
  ('sc_m_dispute', 'ORDER_DISPUTE', 'Order Disputes', 'MERCHANT', 'Buyer order disputes', 15),
  ('sc_m_gst', 'GST_ISSUE', 'GST Issues', 'MERCHANT', 'Invoicing and tax', 16),
  ('sc_r_earnings', 'RIDER_EARNINGS', 'Earnings', 'RIDER', 'Rider earnings', 20),
  ('sc_r_cod', 'COD_MISMATCH', 'COD Mismatch', 'RIDER', 'COD reconciliation', 21),
  ('sc_r_app', 'APP_ISSUE', 'App Issue', 'RIDER', 'Rider app problems', 22),
  ('sc_r_delivery', 'DELIVERY_DISPUTE', 'Delivery Dispute', 'RIDER', 'Delivery disputes', 23),
  ('sc_r_account', 'RIDER_ACCOUNT', 'Account Issue', 'RIDER', 'Rider account', 24),
  ('sc_r_kyc', 'RIDER_KYC', 'KYC Issue', 'RIDER', 'Rider KYC', 25);

INSERT INTO "support_tags" ("id", "name") VALUES
  ('tag_fraud', 'fraud-related'),
  ('tag_refund', 'refund-related'),
  ('tag_finance', 'finance-related'),
  ('tag_escalated', 'escalated');

INSERT INTO "help_articles" ("id", "slug", "title", "body", "kind", "category", "audience", "sort_order", "updated_at") VALUES
  ('ha_track', 'how-to-track-order', 'How do I track my order?', 'Go to Orders and tap your active order for live status and rider tracking.', 'FAQ', 'Orders', 'BUYER', 1, NOW()),
  ('ha_refund', 'refund-timeline', 'How long do refunds take?', 'Refunds are processed within 5-7 business days to your original payment method or wallet.', 'FAQ', 'Refunds', 'BUYER', 2, NOW()),
  ('ha_wallet', 'wallet-credits', 'How do wallet credits work?', 'Wallet credits from referrals and rewards can be used at checkout.', 'GUIDE', 'Wallet', 'BUYER', 3, NOW()),
  ('ha_settlement', 'merchant-settlement', 'When do merchants get paid?', 'Settlements are batched daily or weekly based on your store configuration.', 'FAQ', 'Merchant', 'MERCHANT', 1, NOW()),
  ('ha_rider_cod', 'rider-cod-remittance', 'COD remittance guide', 'Submit collected COD within 24 hours via the rider app.', 'GUIDE', 'Rider', 'RIDER', 1, NOW());
