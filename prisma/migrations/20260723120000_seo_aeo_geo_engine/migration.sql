-- P7.6 SEO, AEO & GEO Growth Engine

CREATE TYPE "SeoPageType" AS ENUM ('CITY', 'CITY_CATEGORY', 'STORE', 'CATEGORY', 'BRAND', 'FAQ', 'STATIC');
CREATE TYPE "SeoEntityType" AS ENUM ('PLATFORM', 'PLUS', 'STORE', 'CATEGORY', 'CITY', 'MERCHANT', 'BRAND');
CREATE TYPE "GeoMentionEngine" AS ENUM ('CHATGPT', 'OPENAI', 'GEMINI', 'GOOGLE_AI_OVERVIEW', 'PERPLEXITY', 'CLAUDE', 'COPILOT', 'BING_AI', 'OTHER');
CREATE TYPE "SitemapType" AS ENUM ('INDEX', 'PRODUCTS', 'STORES', 'CATEGORIES', 'CITIES', 'FAQ');
CREATE TYPE "AiCrawlerType" AS ENUM ('CHATGPT', 'OPENAI', 'GEMINI', 'GOOGLE_AI', 'PERPLEXITY', 'CLAUDE', 'BING_AI', 'OTHER');

CREATE TABLE "seo_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "page_type" "SeoPageType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "h1" TEXT,
    "canonical_url" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "city_id" TEXT,
    "category_id" TEXT,
    "store_id" TEXT,
    "brand_slug" TEXT,
    "meta_json" JSONB,
    "indexable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seo_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_faqs" (
    "id" TEXT NOT NULL,
    "page_id" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "city_id" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "aeo_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seo_faqs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_keywords" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "page_id" TEXT,
    "store_id" TEXT,
    "avg_position" DOUBLE PRECISION,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tracked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_keywords_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_entities" (
    "id" TEXT NOT NULL,
    "entity_type" "SeoEntityType" NOT NULL,
    "entity_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "relations" JSONB NOT NULL DEFAULT '[]',
    "knowledge_json" JSONB,
    "coverage_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seo_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seo_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "organic_traffic" INTEGER NOT NULL DEFAULT 0,
    "keyword_rankings" JSONB NOT NULL DEFAULT '{}',
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ai_citations" INTEGER NOT NULL DEFAULT 0,
    "featured_snippet_wins" INTEGER NOT NULL DEFAULT 0,
    "geo_visibility_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aeo_visibility_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "geo_mentions" (
    "id" TEXT NOT NULL,
    "engine" "GeoMentionEngine" NOT NULL,
    "query" TEXT NOT NULL,
    "cited_url" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "sentiment" TEXT,
    "mention_text" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geo_mentions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sitemap_indices" (
    "id" TEXT NOT NULL,
    "sitemap_type" "SitemapType" NOT NULL,
    "url" TEXT NOT NULL,
    "last_generated_at" TIMESTAMP(3) NOT NULL,
    "url_count" INTEGER NOT NULL DEFAULT 0,
    "xml_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sitemap_indices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_crawler_visits" (
    "id" TEXT NOT NULL,
    "crawler_user_agent" TEXT NOT NULL,
    "crawler_type" "AiCrawlerType" NOT NULL,
    "path" TEXT NOT NULL,
    "ip_address" TEXT,
    "indexed_entity_type" TEXT,
    "indexed_entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_crawler_visits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seo_pages_slug_key" ON "seo_pages"("slug");
CREATE UNIQUE INDEX "seo_pages_path_key" ON "seo_pages"("path");
CREATE INDEX "seo_pages_page_type_indexable_idx" ON "seo_pages"("page_type", "indexable");
CREATE INDEX "seo_pages_city_id_idx" ON "seo_pages"("city_id");
CREATE INDEX "seo_pages_store_id_idx" ON "seo_pages"("store_id");

CREATE UNIQUE INDEX "seo_faqs_slug_key" ON "seo_faqs"("slug");
CREATE INDEX "seo_faqs_featured_aeo_score_idx" ON "seo_faqs"("featured", "aeo_score" DESC);

CREATE INDEX "seo_keywords_keyword_idx" ON "seo_keywords"("keyword");
CREATE INDEX "seo_keywords_store_id_idx" ON "seo_keywords"("store_id");

CREATE UNIQUE INDEX "seo_entities_entity_type_slug_key" ON "seo_entities"("entity_type", "slug");
CREATE INDEX "seo_entities_entity_type_coverage_score_idx" ON "seo_entities"("entity_type", "coverage_score" DESC);

CREATE UNIQUE INDEX "seo_snapshots_snapshot_date_key" ON "seo_snapshots"("snapshot_date");

CREATE INDEX "geo_mentions_engine_detected_at_idx" ON "geo_mentions"("engine", "detected_at" DESC);

CREATE UNIQUE INDEX "sitemap_indices_sitemap_type_key" ON "sitemap_indices"("sitemap_type");

CREATE INDEX "ai_crawler_visits_crawler_type_created_at_idx" ON "ai_crawler_visits"("crawler_type", "created_at" DESC);
CREATE INDEX "ai_crawler_visits_path_idx" ON "ai_crawler_visits"("path");

ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seo_faqs" ADD CONSTRAINT "seo_faqs_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "seo_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seo_faqs" ADD CONSTRAINT "seo_faqs_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seo_keywords" ADD CONSTRAINT "seo_keywords_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "seo_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seo_keywords" ADD CONSTRAINT "seo_keywords_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
