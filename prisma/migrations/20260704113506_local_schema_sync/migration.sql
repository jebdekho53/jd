-- DropIndex
DROP INDEX "merchant_applications_location_city_id_idx";

-- DropIndex
DROP INDEX "merchant_applications_location_pincode_id_idx";

-- DropIndex
DROP INDEX "restaurant_menu_search_index_search_vector_idx";

-- DropIndex
DROP INDEX "reviews_store_id_idx";

-- DropIndex
DROP INDEX "stores_delivery_radius_km_idx";

-- CreateIndex
CREATE INDEX "ad_campaigns_status_start_at_idx" ON "ad_campaigns"("status", "start_at");

-- CreateIndex
CREATE INDEX "ad_clicks_campaign_id_created_at_idx" ON "ad_clicks"("campaign_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ad_conversions_campaign_id_created_at_idx" ON "ad_conversions"("campaign_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ad_groups_campaign_id_idx" ON "ad_groups"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_impressions_placement_created_at_idx" ON "ad_impressions"("placement", "created_at" DESC);

-- CreateIndex
CREATE INDEX "approval_workflows_account_id_idx" ON "approval_workflows"("account_id");

-- CreateIndex
CREATE INDEX "cod_reconciliations_status_created_at_idx" ON "cod_reconciliations"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "commission_rules_store_id_idx" ON "commission_rules"("store_id");

-- CreateIndex
CREATE INDEX "commission_rules_category_id_idx" ON "commission_rules"("category_id");

-- CreateIndex
CREATE INDEX "commission_rules_campaign_id_idx" ON "commission_rules"("campaign_id");

-- CreateIndex
CREATE INDEX "corporate_accounts_status_idx" ON "corporate_accounts"("status");

-- CreateIndex
CREATE INDEX "corporate_invoices_account_id_created_at_idx" ON "corporate_invoices"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cost_centers_account_id_idx" ON "cost_centers"("account_id");

-- CreateIndex
CREATE INDEX "finance_alerts_alert_type_created_at_idx" ON "finance_alerts"("alert_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "merchant_payouts_merchant_profile_id_status_idx" ON "merchant_payouts"("merchant_profile_id", "status");

-- CreateIndex
CREATE INDEX "rider_payouts_rider_profile_id_status_idx" ON "rider_payouts"("rider_profile_id", "status");

-- CreateIndex
CREATE INDEX "settlement_items_settlement_id_idx" ON "settlement_items"("settlement_id");

-- CreateIndex
CREATE INDEX "settlements_period_start_period_end_idx" ON "settlements"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "tax_records_period_month_idx" ON "tax_records"("period_month");

-- CreateIndex
CREATE INDEX "tax_records_merchant_profile_id_idx" ON "tax_records"("merchant_profile_id");

-- CreateIndex
CREATE INDEX "tax_records_order_id_idx" ON "tax_records"("order_id");

-- RenameIndex
ALTER INDEX "customer_affinities_user_id_affinity_type_entity_type_entity_id" RENAME TO "customer_affinities_user_id_affinity_type_entity_type_entit_key";

-- RenameIndex
ALTER INDEX "merchant_ai_wallet_transactions_merchant_profile_id_created_at_" RENAME TO "merchant_ai_wallet_transactions_merchant_profile_id_created_idx";

-- RenameIndex
ALTER INDEX "merchant_application_business_types_application_id_business_typ" RENAME TO "merchant_application_business_types_application_id_business_key";

-- RenameIndex
ALTER INDEX "purchase_recommendations_merchant_profile_id_is_dismissed_creat" RENAME TO "purchase_recommendations_merchant_profile_id_is_dismissed_c_idx";
