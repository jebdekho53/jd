-- P2.1 Order timeline governance

CREATE TYPE "OrderActorType" AS ENUM ('BUYER', 'MERCHANT', 'ADMIN', 'RIDER', 'SYSTEM');

ALTER TABLE "order_status_history" ADD COLUMN "actor_type" "OrderActorType" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "order_status_history" ADD COLUMN "metadata" JSONB;

-- Backfill actor_type from context where possible (best-effort)
UPDATE "order_status_history" SET "actor_type" = 'BUYER'
WHERE "note" ILIKE '%buyer%' OR "note" ILIKE '%cancelled by you%';

UPDATE "order_status_history" SET "actor_type" = 'MERCHANT'
WHERE "note" ILIKE '%merchant%' OR "note" ILIKE '%store%';

UPDATE "order_status_history" SET "actor_type" = 'RIDER'
WHERE "note" ILIKE '%rider%' OR "note" ILIKE '%delivery%' OR "note" ILIKE '%picked up%';

UPDATE "order_status_history" SET "actor_type" = 'ADMIN'
WHERE "note" ILIKE '%admin%' OR "note" ILIKE '%reassign%';

ALTER TABLE "deliveries" ADD COLUMN "arrived_at_store_at" TIMESTAMP(3);
ALTER TABLE "deliveries" ADD COLUMN "arrived_at_customer_at" TIMESTAMP(3);
