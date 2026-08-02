-- AlterTable: add share_token as nullable first so existing rows can be backfilled
-- before the NOT NULL + unique constraints are applied.
ALTER TABLE "offline_bills" ADD COLUMN "share_token" TEXT;

UPDATE "offline_bills" SET "share_token" = md5(random()::text || id || clock_timestamp()::text) WHERE "share_token" IS NULL;

ALTER TABLE "offline_bills" ALTER COLUMN "share_token" SET NOT NULL;

CREATE UNIQUE INDEX "offline_bills_share_token_key" ON "offline_bills"("share_token");
