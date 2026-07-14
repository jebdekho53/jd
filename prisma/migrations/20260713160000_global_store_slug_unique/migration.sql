-- Make store slugs GLOBALLY unique.
--
-- Public store URLs are global (/store/[slug]), so slug uniqueness must be
-- global rather than per-merchant. Verified before authoring: production has
-- 0 cross-merchant slug collisions (active or soft-deleted), so this is a
-- non-destructive index swap that renames no rows and breaks no existing URL.
--
-- Rollback: DROP INDEX "stores_slug_key";
--           CREATE UNIQUE INDEX "stores_merchant_profile_id_slug_key"
--             ON "stores"("merchant_profile_id", "slug");

-- DropIndex (old per-merchant uniqueness)
DROP INDEX "stores_merchant_profile_id_slug_key";

-- CreateIndex (new global uniqueness)
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
