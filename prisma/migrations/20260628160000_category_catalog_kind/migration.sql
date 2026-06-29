-- CreateEnum
CREATE TYPE "CategoryCatalogKind" AS ENUM ('PRODUCT', 'MENU');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "catalog_kind" "CategoryCatalogKind" NOT NULL DEFAULT 'PRODUCT';

-- AlterTable
ALTER TABLE "restaurant_menu_categories" ADD COLUMN "platform_category_id" TEXT;

-- CreateIndex
CREATE INDEX "categories_catalog_kind_is_active_idx" ON "categories"("catalog_kind", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_menu_categories_store_id_platform_category_id_key" ON "restaurant_menu_categories"("store_id", "platform_category_id");

-- AddForeignKey
ALTER TABLE "restaurant_menu_categories" ADD CONSTRAINT "restaurant_menu_categories_platform_category_id_fkey" FOREIGN KEY ("platform_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
