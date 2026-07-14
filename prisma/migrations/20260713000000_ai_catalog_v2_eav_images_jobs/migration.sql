-- AI Product Cataloging v2 — async pipeline, EAV attributes, versioned image assets
-- Additive migration. The v1 synchronous AIProductAnalysis flow is untouched.

-- ── Enum additions (existing enum) ─────────────────────────────────────────
-- New states for the async pipeline + moderation. ADD VALUE is idempotent-safe
-- via IF NOT EXISTS (Postgres 12+).
ALTER TYPE "AIProductAnalysisStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
ALTER TYPE "AIProductAnalysisStatus" ADD VALUE IF NOT EXISTS 'MODERATION_HOLD';

-- ── New enums ──────────────────────────────────────────────────────────────
CREATE TYPE "AttributeDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'ENUM', 'MULTI_SELECT', 'COLOR', 'DIMENSION', 'WEIGHT', 'VOLUME', 'DATE');
CREATE TYPE "AIProductImageStatus" AS ENUM ('QUEUED', 'GENERATING', 'GENERATED', 'APPROVED', 'REJECTED', 'FAILED');
CREATE TYPE "AIProductJobType" AS ENUM ('ANALYSIS', 'IMAGE_GENERATION', 'RETRY', 'MODERATION');
CREATE TYPE "AIProductJobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED', 'MODERATION_PENDING', 'MODERATION_APPROVED', 'MODERATION_REJECTED');

-- ── attribute_groups ───────────────────────────────────────────────────────
CREATE TABLE "attribute_groups" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attribute_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attribute_groups_key_key" ON "attribute_groups"("key");
CREATE INDEX "attribute_groups_is_active_sort_order_idx" ON "attribute_groups"("is_active", "sort_order");

-- ── unit_definitions ───────────────────────────────────────────────────────
CREATE TABLE "unit_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "base_unit_key" TEXT,
    "to_base_factor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "unit_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "unit_definitions_key_key" ON "unit_definitions"("key");
CREATE INDEX "unit_definitions_dimension_is_active_idx" ON "unit_definitions"("dimension", "is_active");

-- ── attribute_definitions ──────────────────────────────────────────────────
CREATE TABLE "attribute_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group_id" TEXT,
    "data_type" "AttributeDataType" NOT NULL,
    "description" TEXT,
    "is_facet" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "is_searchable" BOOLEAN NOT NULL DEFAULT false,
    "is_variant_axis" BOOLEAN NOT NULL DEFAULT false,
    "unit_dimension" TEXT,
    "default_unit_id" TEXT,
    "ai_extraction_key" TEXT,
    "validation_regex" TEXT,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attribute_definitions_key_key" ON "attribute_definitions"("key");
CREATE INDEX "attribute_definitions_group_id_sort_order_idx" ON "attribute_definitions"("group_id", "sort_order");
CREATE INDEX "attribute_definitions_is_active_is_facet_idx" ON "attribute_definitions"("is_active", "is_facet");
CREATE INDEX "attribute_definitions_ai_extraction_key_idx" ON "attribute_definitions"("ai_extraction_key");

-- ── attribute_options ──────────────────────────────────────────────────────
CREATE TABLE "attribute_options" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color_hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attribute_options_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attribute_options_definition_id_value_key" ON "attribute_options"("definition_id", "value");
CREATE INDEX "attribute_options_definition_id_is_active_sort_order_idx" ON "attribute_options"("definition_id", "is_active", "sort_order");

-- ── category_attribute_definitions ─────────────────────────────────────────
CREATE TABLE "category_attribute_definitions" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_facet" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_attribute_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "category_attribute_definitions_category_id_definition_id_key" ON "category_attribute_definitions"("category_id", "definition_id");
CREATE INDEX "category_attribute_definitions_category_id_sort_order_idx" ON "category_attribute_definitions"("category_id", "sort_order");
CREATE INDEX "category_attribute_definitions_definition_id_idx" ON "category_attribute_definitions"("definition_id");

-- ── product_attributes (EAV value layer) ───────────────────────────────────
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_number" DOUBLE PRECISION,
    "value_boolean" BOOLEAN,
    "value_date" TIMESTAMP(3),
    "value_option_id" TEXT,
    "value_option_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "value_json" JSONB,
    "unit_id" TEXT,
    "normalized_number" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "source" TEXT,
    "verified_by_merchant" BOOLEAN NOT NULL DEFAULT false,
    "analysis_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_attributes_product_id_definition_id_key" ON "product_attributes"("product_id", "definition_id");
CREATE INDEX "product_attributes_definition_id_value_option_id_idx" ON "product_attributes"("definition_id", "value_option_id");
CREATE INDEX "product_attributes_definition_id_value_number_idx" ON "product_attributes"("definition_id", "value_number");
CREATE INDEX "product_attributes_definition_id_normalized_number_idx" ON "product_attributes"("definition_id", "normalized_number");
CREATE INDEX "product_attributes_definition_id_value_boolean_idx" ON "product_attributes"("definition_id", "value_boolean");
CREATE INDEX "product_attributes_product_id_idx" ON "product_attributes"("product_id");
CREATE INDEX "product_attributes_analysis_id_idx" ON "product_attributes"("analysis_id");

-- ── ai_product_image_assets (versioned + cached) ───────────────────────────
CREATE TABLE "ai_product_image_assets" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT,
    "output_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AIProductImageStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "model" TEXT,
    "prompt" TEXT,
    "negative_prompt" TEXT,
    "source_image_url" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "transparent" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "file_size_bytes" INTEGER,
    "format" TEXT,
    "cache_key" TEXT NOT NULL,
    "generation_cost_paise" INTEGER NOT NULL DEFAULT 0,
    "generation_time_ms" INTEGER,
    "approval_status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by_merchant" BOOLEAN NOT NULL DEFAULT false,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "metadata" JSONB,
    "job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_product_image_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_product_image_assets_cache_key_key" ON "ai_product_image_assets"("cache_key");
CREATE INDEX "ai_product_image_assets_analysis_id_output_type_version_idx" ON "ai_product_image_assets"("analysis_id", "output_type", "version" DESC);
CREATE INDEX "ai_product_image_assets_product_id_idx" ON "ai_product_image_assets"("product_id");
CREATE INDEX "ai_product_image_assets_status_idx" ON "ai_product_image_assets"("status");
CREATE INDEX "ai_product_image_assets_merchant_profile_id_created_at_idx" ON "ai_product_image_assets"("merchant_profile_id", "created_at" DESC);

-- ── ai_product_jobs (durable BullMQ ledger) ────────────────────────────────
CREATE TABLE "ai_product_jobs" (
    "id" TEXT NOT NULL,
    "job_type" "AIProductJobType" NOT NULL,
    "queue_name" TEXT NOT NULL,
    "bull_job_id" TEXT,
    "analysis_id" TEXT,
    "image_asset_id" TEXT,
    "merchant_profile_id" TEXT NOT NULL,
    "store_id" TEXT,
    "status" "AIProductJobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "result" JSONB,
    "error_message" TEXT,
    "moderation_status" TEXT,
    "moderation_reason" TEXT,
    "moderated_by_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_product_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_product_jobs_idempotency_key_key" ON "ai_product_jobs"("idempotency_key");
CREATE INDEX "ai_product_jobs_status_job_type_idx" ON "ai_product_jobs"("status", "job_type");
CREATE INDEX "ai_product_jobs_analysis_id_idx" ON "ai_product_jobs"("analysis_id");
CREATE INDEX "ai_product_jobs_merchant_profile_id_created_at_idx" ON "ai_product_jobs"("merchant_profile_id", "created_at" DESC);
CREATE INDEX "ai_product_jobs_moderation_status_idx" ON "ai_product_jobs"("moderation_status");

-- ── Foreign keys ───────────────────────────────────────────────────────────
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "attribute_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_default_unit_id_fkey" FOREIGN KEY ("default_unit_id") REFERENCES "unit_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attribute_options" ADD CONSTRAINT "attribute_options_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_attribute_definitions" ADD CONSTRAINT "category_attribute_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_attribute_definitions" ADD CONSTRAINT "category_attribute_definitions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_value_option_id_fkey" FOREIGN KEY ("value_option_id") REFERENCES "attribute_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_product_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_product_image_assets" ADD CONSTRAINT "ai_product_image_assets_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_product_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_product_image_assets" ADD CONSTRAINT "ai_product_image_assets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_product_jobs" ADD CONSTRAINT "ai_product_jobs_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_product_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ai_catalog_settings ────────────────────────────────────────────────────
CREATE TABLE "ai_catalog_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_catalog_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_catalog_settings_key_key" ON "ai_catalog_settings"("key");

-- ── ai_catalog_prompt_versions ─────────────────────────────────────────────
CREATE TABLE "ai_catalog_prompt_versions" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_catalog_prompt_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_catalog_prompt_versions_kind_version_key" ON "ai_catalog_prompt_versions"("kind", "version");
CREATE INDEX "ai_catalog_prompt_versions_kind_is_active_idx" ON "ai_catalog_prompt_versions"("kind", "is_active");

-- ── product_attribute_history ──────────────────────────────────────────────
CREATE TABLE "product_attribute_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "stage" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "confidence" DOUBLE PRECISION,
    "source" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_attribute_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_attribute_history_product_id_definition_id_idx" ON "product_attribute_history"("product_id", "definition_id");
CREATE INDEX "product_attribute_history_analysis_id_idx" ON "product_attribute_history"("analysis_id");
