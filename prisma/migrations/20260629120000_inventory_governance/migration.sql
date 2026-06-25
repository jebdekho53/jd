-- Inventory governance (P1.3)

CREATE TYPE "InventoryStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'DISABLED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INVENTORY_ALERT';

ALTER TABLE "inventory" ADD COLUMN "sold_qty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "inventory" ADD COLUMN "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE';

-- Transform quantity from total-on-hand to available-only (unreserved)
UPDATE "inventory" SET "quantity" = GREATEST(0, "quantity" - "reserved");

UPDATE "inventory" SET "status" = 'OUT_OF_STOCK'
WHERE "quantity" <= 0 AND "reserved" <= 0;

CREATE INDEX "inventory_status_idx" ON "inventory"("status");

ALTER TABLE "inventory_reservations" ADD COLUMN "order_id" TEXT;
ALTER TABLE "inventory_reservations" ADD COLUMN "product_id" TEXT;

CREATE INDEX "inventory_reservations_order_id_idx" ON "inventory_reservations"("order_id");

ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
