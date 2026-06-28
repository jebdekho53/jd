-- Buyer-scoped idempotency: same key may be reused by different buyers
DROP INDEX IF EXISTS "order_claims_idempotency_key_key";

CREATE UNIQUE INDEX "order_claims_buyer_profile_id_idempotency_key_key"
  ON "order_claims" ("buyer_profile_id", "idempotency_key");
