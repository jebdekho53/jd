-- Additive rider Captain app tables: KYC documents, shifts, and incentives.

CREATE TYPE "RiderDocumentType" AS ENUM (
  'ID_PROOF',
  'PAN_CARD',
  'DRIVING_LICENSE',
  'VEHICLE_RC',
  'PROFILE_PHOTO',
  'OTHER'
);

CREATE TYPE "RiderDocumentStatus" AS ENUM (
  'PENDING',
  'SUBMITTED',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "RiderShiftStatus" AS ENUM (
  'ACTIVE',
  'COMPLETED'
);

CREATE TYPE "RiderIncentiveStatus" AS ENUM (
  'ACTIVE',
  'COMPLETED',
  'EXPIRED'
);

CREATE TABLE "rider_documents" (
  "id" TEXT NOT NULL,
  "rider_profile_id" TEXT NOT NULL,
  "document_type" "RiderDocumentType" NOT NULL,
  "file_url" TEXT NOT NULL,
  "status" "RiderDocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
  "rejection_reason" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rider_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rider_shifts" (
  "id" TEXT NOT NULL,
  "rider_profile_id" TEXT NOT NULL,
  "status" "RiderShiftStatus" NOT NULL DEFAULT 'ACTIVE',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  "start_lat" DOUBLE PRECISION,
  "start_lng" DOUBLE PRECISION,
  "end_lat" DOUBLE PRECISION,
  "end_lng" DOUBLE PRECISION,
  "deliveries" INTEGER NOT NULL DEFAULT 0,
  "earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rider_shifts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rider_incentives" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "target_deliveries" INTEGER NOT NULL DEFAULT 0,
  "reward_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "status" "RiderIncentiveStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rider_incentives_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rider_incentive_progress" (
  "id" TEXT NOT NULL,
  "rider_profile_id" TEXT NOT NULL,
  "incentive_id" TEXT NOT NULL,
  "deliveries" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rider_incentive_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rider_documents_rider_profile_id_document_type_key"
  ON "rider_documents"("rider_profile_id", "document_type");
CREATE INDEX "rider_documents_rider_profile_id_status_idx"
  ON "rider_documents"("rider_profile_id", "status");

CREATE INDEX "rider_shifts_rider_profile_id_status_idx"
  ON "rider_shifts"("rider_profile_id", "status");
CREATE INDEX "rider_shifts_started_at_idx"
  ON "rider_shifts"("started_at" DESC);

CREATE UNIQUE INDEX "rider_incentives_code_key"
  ON "rider_incentives"("code");
CREATE INDEX "rider_incentives_status_starts_at_ends_at_idx"
  ON "rider_incentives"("status", "starts_at", "ends_at");

CREATE UNIQUE INDEX "rider_incentive_progress_rider_profile_id_incentive_id_key"
  ON "rider_incentive_progress"("rider_profile_id", "incentive_id");
CREATE INDEX "rider_incentive_progress_rider_profile_id_completed_idx"
  ON "rider_incentive_progress"("rider_profile_id", "completed");

ALTER TABLE "rider_documents"
  ADD CONSTRAINT "rider_documents_rider_profile_id_fkey"
  FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rider_shifts"
  ADD CONSTRAINT "rider_shifts_rider_profile_id_fkey"
  FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rider_incentive_progress"
  ADD CONSTRAINT "rider_incentive_progress_rider_profile_id_fkey"
  FOREIGN KEY ("rider_profile_id") REFERENCES "rider_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rider_incentive_progress"
  ADD CONSTRAINT "rider_incentive_progress_incentive_id_fkey"
  FOREIGN KEY ("incentive_id") REFERENCES "rider_incentives"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
