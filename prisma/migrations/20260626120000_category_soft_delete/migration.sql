-- AlterEnum
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_CREATED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_UPDATED';
ALTER TYPE "DomainEventType" ADD VALUE IF NOT EXISTS 'CATEGORY_DELETED';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "categories_deleted_at_idx" ON "categories"("deleted_at");
