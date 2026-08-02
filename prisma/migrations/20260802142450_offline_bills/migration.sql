-- CreateTable
CREATE TABLE "offline_bills" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_name" TEXT,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_bill_items" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "variant_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "shortfall" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offline_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offline_bills_store_id_created_at_idx" ON "offline_bills"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "offline_bills_store_id_customer_phone_idx" ON "offline_bills"("store_id", "customer_phone");

-- CreateIndex
CREATE INDEX "offline_bill_items_bill_id_idx" ON "offline_bill_items"("bill_id");

-- CreateIndex
CREATE INDEX "offline_bill_items_product_id_idx" ON "offline_bill_items"("product_id");

-- CreateIndex
CREATE INDEX "offline_bill_items_variant_id_idx" ON "offline_bill_items"("variant_id");

-- AddForeignKey
ALTER TABLE "offline_bills" ADD CONSTRAINT "offline_bills_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_bill_items" ADD CONSTRAINT "offline_bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "offline_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_bill_items" ADD CONSTRAINT "offline_bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_bill_items" ADD CONSTRAINT "offline_bill_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

