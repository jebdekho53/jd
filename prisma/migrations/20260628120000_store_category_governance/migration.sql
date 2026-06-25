-- Store-scoped category governance (P1.2)

CREATE TYPE "StoreCategoryRequestStatus" AS ENUM ('PENDING', 'DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED');

ALTER TABLE "categories" ADD COLUMN "icon" TEXT;
ALTER TABLE "categories" ADD COLUMN "description" TEXT;

CREATE TABLE "store_category_requests" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "status" "StoreCategoryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "admin_note" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_category_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_categories" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_category_requests_store_id_category_id_subcategory_id_key"
    ON "store_category_requests"("store_id", "category_id", "subcategory_id");

CREATE INDEX "store_category_requests_store_id_status_idx"
    ON "store_category_requests"("store_id", "status");

CREATE INDEX "store_category_requests_status_idx"
    ON "store_category_requests"("status");

CREATE UNIQUE INDEX "store_categories_store_id_category_id_subcategory_id_key"
    ON "store_categories"("store_id", "category_id", "subcategory_id");

CREATE INDEX "store_categories_store_id_idx" ON "store_categories"("store_id");
CREATE INDEX "store_categories_category_id_idx" ON "store_categories"("category_id");

ALTER TABLE "store_category_requests" ADD CONSTRAINT "store_category_requests_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_category_requests" ADD CONSTRAINT "store_category_requests_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "store_category_requests" ADD CONSTRAINT "store_category_requests_subcategory_id_fkey"
    FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_subcategory_id_fkey"
    FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
