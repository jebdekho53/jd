-- P6.4 Franchise Network, City Expansion & Territory Governance

ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'FRANCHISE';

CREATE TYPE "FranchisePartnerStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "CityLaunchStatus" AS ENUM ('RESEARCH', 'PLANNING', 'RECRUITING', 'SOFT_LAUNCH', 'LIVE');
CREATE TYPE "ExpansionLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED');
CREATE TYPE "TerritoryConflictStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');
CREATE TYPE "FranchiseSettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE "FranchiseAuditAction" AS ENUM ('ONBOARDED', 'APPROVED', 'SUSPENDED', 'TERMINATED', 'TERRITORY_ASSIGNED', 'CONFLICT_DETECTED', 'SETTLEMENT_CREATED', 'CITY_LAUNCH_UPDATED');

CREATE TABLE "franchise_partners" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "gstin" TEXT,
    "pan" TEXT,
    "status" "FranchisePartnerStatus" NOT NULL DEFAULT 'PENDING',
    "commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "city_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "franchise_partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "franchise_territories" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "pincodes" TEXT[],
    "exclusivity_enabled" BOOLEAN NOT NULL DEFAULT false,
    "launch_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "franchise_territories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "franchise_stores" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "franchise_stores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "city_launch_plans" (
    "id" TEXT NOT NULL,
    "city_id" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "launch_status" "CityLaunchStatus" NOT NULL DEFAULT 'RESEARCH',
    "readiness_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_stores" INTEGER NOT NULL DEFAULT 0,
    "target_riders" INTEGER NOT NULL DEFAULT 0,
    "target_gmv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actual_stores" INTEGER NOT NULL DEFAULT 0,
    "actual_riders" INTEGER NOT NULL DEFAULT 0,
    "actual_gmv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "city_launch_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expansion_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" "ExpansionLeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expansion_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territory_conflicts" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "primary_territory_id" TEXT NOT NULL,
    "conflicting_territory_id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "status" "TerritoryConflictStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "territory_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "franchise_audits" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "action" "FranchiseAuditAction" NOT NULL,
    "metadata" JSONB,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "franchise_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "franchise_settlements" (
    "id" TEXT NOT NULL,
    "franchise_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "gross_gmv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "franchise_share" DECIMAL(12,2) NOT NULL,
    "platform_share" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "FranchiseSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "ledger_journal_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "franchise_settlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "franchise_partners_user_id_key" ON "franchise_partners"("user_id");
CREATE INDEX "franchise_partners_status_created_at_idx" ON "franchise_partners"("status", "created_at" DESC);
CREATE INDEX "franchise_partners_city_id_status_idx" ON "franchise_partners"("city_id", "status");
CREATE INDEX "franchise_territories_franchise_id_idx" ON "franchise_territories"("franchise_id");
CREATE INDEX "franchise_territories_city_state_idx" ON "franchise_territories"("city", "state");
CREATE UNIQUE INDEX "franchise_stores_franchise_id_store_id_key" ON "franchise_stores"("franchise_id", "store_id");
CREATE INDEX "franchise_stores_store_id_idx" ON "franchise_stores"("store_id");
CREATE UNIQUE INDEX "city_launch_plans_city_state_key" ON "city_launch_plans"("city", "state");
CREATE INDEX "city_launch_plans_launch_status_idx" ON "city_launch_plans"("launch_status");
CREATE INDEX "expansion_leads_status_created_at_idx" ON "expansion_leads"("status", "created_at" DESC);
CREATE INDEX "expansion_leads_city_state_idx" ON "expansion_leads"("city", "state");
CREATE INDEX "territory_conflicts_status_created_at_idx" ON "territory_conflicts"("status", "created_at" DESC);
CREATE INDEX "territory_conflicts_franchise_id_idx" ON "territory_conflicts"("franchise_id");
CREATE INDEX "franchise_audits_franchise_id_created_at_idx" ON "franchise_audits"("franchise_id", "created_at" DESC);
CREATE INDEX "franchise_settlements_franchise_id_status_idx" ON "franchise_settlements"("franchise_id", "status");
CREATE INDEX "franchise_settlements_period_start_period_end_idx" ON "franchise_settlements"("period_start", "period_end");

ALTER TABLE "franchise_partners" ADD CONSTRAINT "franchise_partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "franchise_partners" ADD CONSTRAINT "franchise_partners_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "franchise_territories" ADD CONSTRAINT "franchise_territories_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "franchise_stores" ADD CONSTRAINT "franchise_stores_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "franchise_stores" ADD CONSTRAINT "franchise_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "city_launch_plans" ADD CONSTRAINT "city_launch_plans_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "territory_conflicts" ADD CONSTRAINT "territory_conflicts_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "territory_conflicts" ADD CONSTRAINT "territory_conflicts_primary_territory_id_fkey" FOREIGN KEY ("primary_territory_id") REFERENCES "franchise_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "territory_conflicts" ADD CONSTRAINT "territory_conflicts_conflicting_territory_id_fkey" FOREIGN KEY ("conflicting_territory_id") REFERENCES "franchise_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "franchise_audits" ADD CONSTRAINT "franchise_audits_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "franchise_settlements" ADD CONSTRAINT "franchise_settlements_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchise_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
