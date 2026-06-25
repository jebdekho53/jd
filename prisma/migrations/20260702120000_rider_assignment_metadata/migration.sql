-- P2.3 Rider Assignment Center — assignment metadata
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "assigned_by" TEXT;
ALTER TABLE "delivery_assignments" ADD COLUMN IF NOT EXISTS "assigned_by" TEXT;
