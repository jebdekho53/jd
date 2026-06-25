-- P4.2 Search & Discovery analytics events

CREATE TYPE "SearchEventType" AS ENUM (
  'QUERY',
  'IMPRESSION',
  'CLICK',
  'ADD_TO_CART',
  'ORDER',
  'NO_RESULT',
  'STORE_CLICK'
);

CREATE TABLE "search_events" (
  "id" TEXT NOT NULL,
  "event_type" "SearchEventType" NOT NULL,
  "query" TEXT,
  "buyer_profile_id" TEXT,
  "session_id" TEXT,
  "product_id" TEXT,
  "store_id" TEXT,
  "category_id" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "search_events_event_type_created_at_idx" ON "search_events"("event_type", "created_at" DESC);
CREATE INDEX "search_events_query_created_at_idx" ON "search_events"("query", "created_at" DESC);
CREATE INDEX "search_events_store_id_created_at_idx" ON "search_events"("store_id", "created_at" DESC);
CREATE INDEX "search_events_buyer_profile_id_created_at_idx" ON "search_events"("buyer_profile_id", "created_at" DESC);
