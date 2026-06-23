-- Run AFTER prisma migrate: adds PostgreSQL full-text search to product_search_index
-- Usage: psql $DATABASE_URL -f prisma/sql/add-product-fts.sql

ALTER TABLE product_search_index
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(search_text, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS product_search_vector_idx
  ON product_search_index USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS domain_events_unprocessed_idx
  ON domain_events (occurred_at)
  WHERE processed_at IS NULL;
