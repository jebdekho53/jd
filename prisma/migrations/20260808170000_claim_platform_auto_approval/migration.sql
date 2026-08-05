-- Tracks claims instantly refunded by the platform's low-value auto-approval
-- rule (small amount + low-risk reason + buyer under the abuse cap), separate
-- from a merchant's own per-product AUTO approval policy, so the rolling
-- abuse-cap count only reflects platform-driven approvals.
ALTER TABLE "order_claims" ADD COLUMN IF NOT EXISTS "auto_approved_by_platform" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "order_claims_buyer_profile_id_auto_approved_by_platform_created_at_idx"
  ON "order_claims" ("buyer_profile_id", "auto_approved_by_platform", "created_at");
