-- P5.2 GST Invoicing, Tax Automation & Compliance Center

CREATE TYPE "GstSlab" AS ENUM ('ZERO', 'FIVE', 'TWELVE', 'EIGHTEEN', 'TWENTY_EIGHT');
CREATE TYPE "GstSupplyType" AS ENUM ('INTRA_STATE', 'INTER_STATE');
CREATE TYPE "ProductTaxCategory" AS ENUM ('GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED');
CREATE TYPE "GstInvoiceStatus" AS ENUM ('DRAFT', 'FINALIZED', 'VOID');
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOID');
CREATE TYPE "DebitNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOID');

ALTER TABLE "products" ADD COLUMN "hsn_code_id" TEXT;
ALTER TABLE "products" ADD COLUMN "gst_slab" "GstSlab";
ALTER TABLE "products" ADD COLUMN "tax_category" "ProductTaxCategory" NOT NULL DEFAULT 'GOODS';
ALTER TABLE "products" ADD COLUMN "tax_inclusive" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "tax_jurisdictions" (
    "id" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tax_jurisdictions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "slab" "GstSlab" NOT NULL,
    "cgst_rate" DECIMAL(5,2) NOT NULL,
    "sgst_rate" DECIMAL(5,2) NOT NULL,
    "igst_rate" DECIMAL(5,2) NOT NULL,
    "total_rate" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hsn_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "default_gst_slab" "GstSlab" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hsn_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gst_invoice_sequences" (
    "id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "gst_invoice_sequences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gst_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "buyer_profile_id" TEXT NOT NULL,
    "status" "GstInvoiceStatus" NOT NULL DEFAULT 'FINALIZED',
    "supply_type" "GstSupplyType" NOT NULL,
    "supplier_gstin" TEXT,
    "buyer_gstin" TEXT,
    "supplier_state" TEXT NOT NULL,
    "buyer_state" TEXT,
    "place_of_supply" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(12,2) NOT NULL,
    "cgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(12,2) NOT NULL,
    "delivery_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "pdf_storage_key" TEXT,
    "is_immutable" BOOLEAN NOT NULL DEFAULT true,
    "emailed_at" TIMESTAMP(3),
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gst_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gst_invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "order_item_id" TEXT,
    "product_name" TEXT NOT NULL,
    "hsn_code" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "taxable_amount" DECIMAL(12,2) NOT NULL,
    "gst_slab" "GstSlab" NOT NULL,
    "cgst_rate" DECIMAL(5,2) NOT NULL,
    "sgst_rate" DECIMAL(5,2) NOT NULL,
    "igst_rate" DECIMAL(5,2) NOT NULL,
    "cgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "gst_invoice_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_notes" (
    "id" TEXT NOT NULL,
    "credit_note_number" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'ISSUED',
    "reason" TEXT NOT NULL,
    "taxable_amount" DECIMAL(12,2) NOT NULL,
    "cgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(12,2) NOT NULL,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "pdf_storage_key" TEXT,
    "emailed_at" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_note_lines" (
    "id" TEXT NOT NULL,
    "credit_note_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "hsn_code" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxable_amount" DECIMAL(12,2) NOT NULL,
    "cgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "credit_note_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "debit_notes" (
    "id" TEXT NOT NULL,
    "debit_note_number" TEXT NOT NULL,
    "invoice_id" TEXT,
    "order_id" TEXT,
    "merchant_profile_id" TEXT NOT NULL,
    "status" "DebitNoteStatus" NOT NULL DEFAULT 'ISSUED',
    "reason" TEXT NOT NULL,
    "taxable_amount" DECIMAL(12,2) NOT NULL,
    "total_tax" DECIMAL(12,2) NOT NULL,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "debit_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tds_records" (
    "id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "period_month" TEXT NOT NULL,
    "taxable_amount" DECIMAL(14,2) NOT NULL,
    "tds_rate" DECIMAL(5,2) NOT NULL,
    "tds_amount" DECIMAL(12,2) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tds_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tcs_records" (
    "id" TEXT NOT NULL,
    "period_month" TEXT NOT NULL,
    "gmv_amount" DECIMAL(14,2) NOT NULL,
    "tcs_rate" DECIMAL(5,2) NOT NULL,
    "tcs_amount" DECIMAL(12,2) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tcs_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tax_jurisdictions_state_code_key" ON "tax_jurisdictions"("state_code");
CREATE UNIQUE INDEX "tax_rates_slab_key" ON "tax_rates"("slab");
CREATE UNIQUE INDEX "hsn_codes_code_key" ON "hsn_codes"("code");
CREATE UNIQUE INDEX "gst_invoice_sequences_period_key_key" ON "gst_invoice_sequences"("period_key");
CREATE UNIQUE INDEX "gst_invoices_invoice_number_key" ON "gst_invoices"("invoice_number");
CREATE UNIQUE INDEX "gst_invoices_order_id_key" ON "gst_invoices"("order_id");
CREATE UNIQUE INDEX "credit_notes_credit_note_number_key" ON "credit_notes"("credit_note_number");
CREATE UNIQUE INDEX "debit_notes_debit_note_number_key" ON "debit_notes"("debit_note_number");

CREATE INDEX "gst_invoices_merchant_profile_id_invoice_date_idx" ON "gst_invoices"("merchant_profile_id", "invoice_date" DESC);
CREATE INDEX "gst_invoices_invoice_date_idx" ON "gst_invoices"("invoice_date" DESC);
CREATE INDEX "gst_invoice_lines_invoice_id_idx" ON "gst_invoice_lines"("invoice_id");
CREATE INDEX "credit_notes_order_id_idx" ON "credit_notes"("order_id");
CREATE INDEX "credit_notes_issued_at_idx" ON "credit_notes"("issued_at" DESC);
CREATE INDEX "credit_note_lines_credit_note_id_idx" ON "credit_note_lines"("credit_note_id");
CREATE INDEX "debit_notes_merchant_profile_id_idx" ON "debit_notes"("merchant_profile_id");
CREATE INDEX "tds_records_period_month_idx" ON "tds_records"("period_month");
CREATE INDEX "tds_records_merchant_profile_id_period_month_idx" ON "tds_records"("merchant_profile_id", "period_month");
CREATE INDEX "tcs_records_period_month_idx" ON "tcs_records"("period_month");

ALTER TABLE "products" ADD CONSTRAINT "products_hsn_code_id_fkey" FOREIGN KEY ("hsn_code_id") REFERENCES "hsn_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gst_invoices" ADD CONSTRAINT "gst_invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gst_invoices" ADD CONSTRAINT "gst_invoices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gst_invoice_lines" ADD CONSTRAINT "gst_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "gst_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "gst_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tds_records" ADD CONSTRAINT "tds_records_merchant_profile_id_fkey" FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed GST slabs (CGST+SGST = total for intra; IGST = total for inter)
INSERT INTO "tax_rates" ("id", "slab", "cgst_rate", "sgst_rate", "igst_rate", "total_rate", "updated_at") VALUES
  ('tr_gst_zero', 'ZERO', 0, 0, 0, 0, NOW()),
  ('tr_gst_five', 'FIVE', 2.5, 2.5, 5, 5, NOW()),
  ('tr_gst_twelve', 'TWELVE', 6, 6, 12, 12, NOW()),
  ('tr_gst_eighteen', 'EIGHTEEN', 9, 9, 18, 18, NOW()),
  ('tr_gst_twenty_eight', 'TWENTY_EIGHT', 14, 14, 28, 28, NOW());

-- Sample HSN codes
INSERT INTO "hsn_codes" ("id", "code", "description", "default_gst_slab") VALUES
  ('hsn_2106', '2106', 'Food preparations', 'FIVE'),
  ('hsn_2202', '2202', 'Waters and soft drinks', 'EIGHTEEN'),
  ('hsn_3304', '3304', 'Beauty or make-up preparations', 'EIGHTEEN'),
  ('hsn_6109', '6109', 'T-shirts, knitted', 'FIVE'),
  ('hsn_8517', '8517', 'Telephone sets', 'EIGHTEEN'),
  ('hsn_9997', '9997', 'Other services', 'EIGHTEEN');

-- Indian state jurisdictions (subset for demo)
INSERT INTO "tax_jurisdictions" ("id", "state_code", "state_name") VALUES
  ('tj_mh', '27', 'Maharashtra'),
  ('tj_dl', '07', 'Delhi'),
  ('tj_ka', '29', 'Karnataka'),
  ('tj_tn', '33', 'Tamil Nadu'),
  ('tj_gj', '24', 'Gujarat'),
  ('tj_up', '09', 'Uttar Pradesh'),
  ('tj_wb', '19', 'West Bengal'),
  ('tj_ts', '36', 'Telangana');
