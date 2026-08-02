-- Adds indexes for foreign-key columns that were being filtered/joined on
-- with no index backing them (found via schema audit, confirmed against
-- actual query patterns in the service layer). Uses CONCURRENTLY on every
-- statement so this never takes a blocking lock on these live, actively
-- written tables — each statement builds its index without blocking
-- concurrent reads/writes, at the cost of a slower build. Because of
-- CONCURRENTLY, none of this runs inside a transaction (Postgres forbids
-- that combination); Prisma's migration engine detects CONCURRENTLY and
-- skips the transaction wrapper automatically.

-- CreateIndex
CREATE INDEX CONCURRENTLY "stores_merchant_profile_id_idx" ON "stores"("merchant_profile_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "reviews_buyer_profile_id_idx" ON "reviews"("buyer_profile_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "product_reviews_buyer_profile_id_idx" ON "product_reviews"("buyer_profile_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "product_reviews_order_id_idx" ON "product_reviews"("order_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY "product_reviews_order_item_id_idx" ON "product_reviews"("order_item_id");
