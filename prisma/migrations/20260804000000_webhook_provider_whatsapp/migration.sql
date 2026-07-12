-- Add WHATSAPP to the webhook provider enum.
-- Kept in its own migration: Postgres forbids using a newly added enum value
-- in the same transaction that adds it.
ALTER TYPE "WebhookProvider" ADD VALUE IF NOT EXISTS 'WHATSAPP';
