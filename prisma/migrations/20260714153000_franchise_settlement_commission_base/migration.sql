-- Phase 3 franchise settlements: commission-of-commission accounting.
-- Additive-only: keeps historical settlements and local/prod data intact.

ALTER TABLE "franchise_settlements"
ADD COLUMN IF NOT EXISTS "commission_base" DECIMAL(14, 2) NOT NULL DEFAULT 0;

UPDATE "franchise_partners"
SET "commission_percent" = 10
WHERE "commission_percent" IS DISTINCT FROM 10;

ALTER TABLE "franchise_partners"
ALTER COLUMN "commission_percent" SET DEFAULT 10;

INSERT INTO "ledger_accounts" ("id", "code", "name", "kind", "is_active", "created_at")
VALUES ('acct_franchise', 'FRANCHISE_PAYABLE', 'Franchise Payable', 'LIABILITY', true, now())
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "kind" = EXCLUDED."kind",
    "is_active" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "franchise_settlements_franchise_id_period_start_period_end_key"
ON "franchise_settlements" ("franchise_id", "period_start", "period_end");
