-- Legal acceptance evidence: append-only record of who accepted which document
-- version, when, and from where. Additive and idempotent — safe to re-run.

DO $$ BEGIN
  CREATE TYPE "LegalDocumentCode" AS ENUM (
    'BUYER_TERMS',
    'MERCHANT_AGREEMENT',
    'FRANCHISE_AGREEMENT',
    'RIDER_AGREEMENT',
    'PRIVACY_POLICY'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "legal_acceptances" (
  "id"          TEXT NOT NULL,
  "user_id"     TEXT NOT NULL,
  "code"        "LegalDocumentCode" NOT NULL,
  "version"     TEXT NOT NULL,
  "ip_address"  TEXT,
  "user_agent"  TEXT,
  "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "legal_acceptances_user_id_code_idx"
  ON "legal_acceptances"("user_id", "code");

CREATE INDEX IF NOT EXISTS "legal_acceptances_code_version_idx"
  ON "legal_acceptances"("code", "version");

DO $$ BEGIN
  ALTER TABLE "legal_acceptances"
    ADD CONSTRAINT "legal_acceptances_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
