-- Phase 2 — the franchise application funnel. ExpansionLead becomes a real model.
--
-- Additive only, against a 0-row table. `pincodes` feeds
-- TerritoryService.assignTerritory() at approval so exclusivity conflict detection
-- runs on the territory the applicant actually asked for; `converted_franchise_id`
-- records which partner the lead became, which is otherwise unrecoverable.

-- AlterTable
ALTER TABLE "expansion_leads" ADD COLUMN     "converted_franchise_id" TEXT,
ADD COLUMN     "investment_capacity" DECIMAL(12,2),
ADD COLUMN     "pincodes" TEXT[],
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT;

-- CreateIndex
-- One lead converts to at most one partner.
CREATE UNIQUE INDEX "expansion_leads_converted_franchise_id_key" ON "expansion_leads"("converted_franchise_id");

-- CreateIndex
-- Dedupe/lookup by phone on a public, unauthenticated funnel.
CREATE INDEX "expansion_leads_phone_idx" ON "expansion_leads"("phone");

-- AddForeignKey
-- ON DELETE SET NULL: removing a partner must never delete the application it came from.
ALTER TABLE "expansion_leads" ADD CONSTRAINT "expansion_leads_converted_franchise_id_fkey" FOREIGN KEY ("converted_franchise_id") REFERENCES "franchise_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
