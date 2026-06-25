-- P6.3 Vendor Marketplace, Procurement & B2B Supply Chain

ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'VENDOR';

CREATE TYPE "VendorType" AS ENUM ('BRAND', 'MANUFACTURER', 'WHOLESALER', 'DISTRIBUTOR', 'IMPORTER', 'LOCAL_SUPPLIER');
CREATE TYPE "VendorOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE "VendorShipmentStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED');
CREATE TYPE "VendorInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "VendorSettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE "ProcurementAlertType" AS ENUM ('LOW_STOCK_REPLENISH', 'HIGH_DEMAND_ALERT', 'SEASONAL_DEMAND_ALERT', 'FAST_MOVING_SKU', 'OUT_OF_STOCK_RISK');
CREATE TYPE "VendorReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVED', 'REJECTED');
CREATE TYPE "VendorDisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendor_type" "VendorType" NOT NULL,
    "business_name" TEXT NOT NULL,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city_id" TEXT,
    "line1" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "service_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_catalogs" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_catalogs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_products" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "hsn_code" TEXT,
    "gst_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "base_price" DECIMAL(10,2) NOT NULL,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "lead_time_days" INTEGER NOT NULL DEFAULT 3,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_inventories" (
    "id" TEXT NOT NULL,
    "vendor_product_id" TEXT NOT NULL,
    "available_qty" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_inventories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_price_tiers" (
    "id" TEXT NOT NULL,
    "vendor_product_id" TEXT NOT NULL,
    "min_qty" INTEGER NOT NULL,
    "max_qty" INTEGER,
    "unit_price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "vendor_price_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_carts" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT,
    "vendor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "procurement_carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "vendor_product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "procurement_cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_wishlists" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "vendor_product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "procurement_wishlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT,
    "vendor_id" TEXT NOT NULL,
    "status" "VendorOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "credit_used" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_order_items" (
    "id" TEXT NOT NULL,
    "vendor_order_id" TEXT NOT NULL,
    "vendor_product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "vendor_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_shipments" (
    "id" TEXT NOT NULL,
    "vendor_order_id" TEXT NOT NULL,
    "status" "VendorShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "carrier" TEXT,
    "tracking_number" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_invoices" (
    "id" TEXT NOT NULL,
    "vendor_order_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "VendorInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_settlements" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "VendorSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_settlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_credit_lines" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "used_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "overdue_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_credit_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_recommendations" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT,
    "vendor_product_id" TEXT,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "current_stock" INTEGER NOT NULL,
    "avg_daily_sales" DOUBLE PRECISION NOT NULL,
    "predicted_oos_days" DOUBLE PRECISION NOT NULL,
    "recommended_qty" INTEGER NOT NULL,
    "suggested_vendor_id" TEXT,
    "expected_revenue_impact" DECIMAL(12,2) NOT NULL,
    "alert_type" "ProcurementAlertType" NOT NULL,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_ratings" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_returns" (
    "id" TEXT NOT NULL,
    "vendor_order_id" TEXT NOT NULL,
    "status" "VendorReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "vendor_returns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_disputes" (
    "id" TEXT NOT NULL,
    "vendor_order_id" TEXT NOT NULL,
    "status" "VendorDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "vendor_disputes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_profiles_user_id_key" ON "vendor_profiles"("user_id");
CREATE UNIQUE INDEX "vendor_profiles_vendor_id_key" ON "vendor_profiles"("vendor_id");
CREATE INDEX "vendors_vendor_type_is_active_idx" ON "vendors"("vendor_type", "is_active");
CREATE INDEX "vendors_city_id_is_active_idx" ON "vendors"("city_id", "is_active");
CREATE INDEX "vendor_catalogs_vendor_id_is_active_idx" ON "vendor_catalogs"("vendor_id", "is_active");
CREATE UNIQUE INDEX "vendor_products_vendor_id_sku_key" ON "vendor_products"("vendor_id", "sku");
CREATE INDEX "vendor_products_catalog_id_is_active_idx" ON "vendor_products"("catalog_id", "is_active");
CREATE UNIQUE INDEX "vendor_inventories_vendor_product_id_key" ON "vendor_inventories"("vendor_product_id");
CREATE INDEX "vendor_price_tiers_vendor_product_id_min_qty_idx" ON "vendor_price_tiers"("vendor_product_id", "min_qty");
CREATE INDEX "procurement_carts_merchant_profile_id_idx" ON "procurement_carts"("merchant_profile_id");
CREATE UNIQUE INDEX "procurement_cart_items_cart_id_vendor_product_id_key" ON "procurement_cart_items"("cart_id", "vendor_product_id");
CREATE UNIQUE INDEX "procurement_wishlists_merchant_profile_id_vendor_product_id_key" ON "procurement_wishlists"("merchant_profile_id", "vendor_product_id");
CREATE UNIQUE INDEX "vendor_orders_order_number_key" ON "vendor_orders"("order_number");
CREATE INDEX "vendor_orders_merchant_profile_id_status_idx" ON "vendor_orders"("merchant_profile_id", "status");
CREATE INDEX "vendor_orders_vendor_id_status_created_at_idx" ON "vendor_orders"("vendor_id", "status", "created_at" DESC);
CREATE INDEX "vendor_order_items_vendor_order_id_idx" ON "vendor_order_items"("vendor_order_id");
CREATE UNIQUE INDEX "vendor_shipments_vendor_order_id_key" ON "vendor_shipments"("vendor_order_id");
CREATE UNIQUE INDEX "vendor_invoices_vendor_order_id_key" ON "vendor_invoices"("vendor_order_id");
CREATE UNIQUE INDEX "vendor_invoices_invoice_number_key" ON "vendor_invoices"("invoice_number");
CREATE INDEX "vendor_settlements_vendor_id_status_idx" ON "vendor_settlements"("vendor_id", "status");
CREATE UNIQUE INDEX "vendor_credit_lines_vendor_id_merchant_profile_id_key" ON "vendor_credit_lines"("vendor_id", "merchant_profile_id");
CREATE INDEX "vendor_credit_lines_merchant_profile_id_is_active_idx" ON "vendor_credit_lines"("merchant_profile_id", "is_active");
CREATE INDEX "purchase_recommendations_merchant_profile_id_is_dismissed_created_at_idx" ON "purchase_recommendations"("merchant_profile_id", "is_dismissed", "created_at" DESC);
CREATE INDEX "purchase_recommendations_alert_type_created_at_idx" ON "purchase_recommendations"("alert_type", "created_at" DESC);
CREATE UNIQUE INDEX "vendor_ratings_vendor_id_merchant_profile_id_key" ON "vendor_ratings"("vendor_id", "merchant_profile_id");
CREATE INDEX "vendor_returns_vendor_order_id_status_idx" ON "vendor_returns"("vendor_order_id", "status");
CREATE INDEX "vendor_disputes_vendor_order_id_status_idx" ON "vendor_disputes"("vendor_order_id", "status");

ALTER TABLE "vendors" ADD CONSTRAINT "vendors_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_catalogs" ADD CONSTRAINT "vendor_catalogs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vendor_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_inventories" ADD CONSTRAINT "vendor_inventories_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "vendor_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_price_tiers" ADD CONSTRAINT "vendor_price_tiers_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "vendor_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_carts" ADD CONSTRAINT "procurement_carts_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_carts" ADD CONSTRAINT "procurement_carts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "procurement_cart_items" ADD CONSTRAINT "procurement_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "procurement_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_cart_items" ADD CONSTRAINT "procurement_cart_items_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "vendor_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "procurement_wishlists" ADD CONSTRAINT "procurement_wishlists_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_wishlists" ADD CONSTRAINT "procurement_wishlists_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "vendor_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_orders" ADD CONSTRAINT "vendor_orders_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_orders" ADD CONSTRAINT "vendor_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_order_items" ADD CONSTRAINT "vendor_order_items_vendor_order_id_fkey" FOREIGN KEY ("vendor_order_id") REFERENCES "vendor_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_order_items" ADD CONSTRAINT "vendor_order_items_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "vendor_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_shipments" ADD CONSTRAINT "vendor_shipments_vendor_order_id_fkey" FOREIGN KEY ("vendor_order_id") REFERENCES "vendor_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_order_id_fkey" FOREIGN KEY ("vendor_order_id") REFERENCES "vendor_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_settlements" ADD CONSTRAINT "vendor_settlements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_credit_lines" ADD CONSTRAINT "vendor_credit_lines_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_credit_lines" ADD CONSTRAINT "vendor_credit_lines_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "purchase_recommendations_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_recommendations" ADD CONSTRAINT "purchase_recommendations_vendor_product_id_fkey" FOREIGN KEY ("vendor_product_id") REFERENCES "vendor_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_returns" ADD CONSTRAINT "vendor_returns_vendor_order_id_fkey" FOREIGN KEY ("vendor_order_id") REFERENCES "vendor_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_disputes" ADD CONSTRAINT "vendor_disputes_vendor_order_id_fkey" FOREIGN KEY ("vendor_order_id") REFERENCES "vendor_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
