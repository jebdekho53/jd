-- P4.1 Analytics & BI snapshots

CREATE TYPE "AnalyticsSnapshotScope" AS ENUM ('PLATFORM', 'STORE');
CREATE TYPE "AnalyticsAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "AnalyticsAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE "analytics_daily_snapshots" (
  "id" TEXT NOT NULL,
  "scope" "AnalyticsSnapshotScope" NOT NULL,
  "scope_id" TEXT,
  "snapshot_date" DATE NOT NULL,
  "metrics" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "analytics_daily_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_hourly_snapshots" (
  "id" TEXT NOT NULL,
  "scope" "AnalyticsSnapshotScope" NOT NULL,
  "scope_id" TEXT,
  "bucket_at" TIMESTAMP(3) NOT NULL,
  "metrics" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_hourly_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_alerts" (
  "id" TEXT NOT NULL,
  "alert_type" TEXT NOT NULL,
  "severity" "AnalyticsAlertSeverity" NOT NULL DEFAULT 'WARNING',
  "status" "AnalyticsAlertStatus" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "analytics_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_daily_snapshots_scope_scope_id_snapshot_date_key" ON "analytics_daily_snapshots"("scope", "scope_id", "snapshot_date");
CREATE INDEX "analytics_daily_snapshots_snapshot_date_idx" ON "analytics_daily_snapshots"("snapshot_date");
CREATE INDEX "analytics_daily_snapshots_scope_scope_id_idx" ON "analytics_daily_snapshots"("scope", "scope_id");

CREATE UNIQUE INDEX "analytics_hourly_snapshots_scope_scope_id_bucket_at_key" ON "analytics_hourly_snapshots"("scope", "scope_id", "bucket_at");
CREATE INDEX "analytics_hourly_snapshots_bucket_at_idx" ON "analytics_hourly_snapshots"("bucket_at");

CREATE INDEX "analytics_alerts_status_created_at_idx" ON "analytics_alerts"("status", "created_at" DESC);
CREATE INDEX "analytics_alerts_alert_type_idx" ON "analytics_alerts"("alert_type");
