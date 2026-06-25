-- CreateEnum
CREATE TYPE "AdminCredentialSource" AS ENUM ('DATABASE', 'ENV_BOOTSTRAP');

-- AlterTable
ALTER TABLE "admin_profiles" ADD COLUMN "phone" TEXT,
ADD COLUMN "credential_source" "AdminCredentialSource" NOT NULL DEFAULT 'DATABASE',
ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMP(3),
ADD COLUMN "last_login_at" TIMESTAMP(3),
ADD COLUMN "password_changed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_name" TEXT,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "logged_out_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_login_audits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "max_failed_attempts" INTEGER NOT NULL DEFAULT 10,
    "lockout_minutes" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_refresh_token_id_key" ON "admin_sessions"("refresh_token_id");

-- CreateIndex
CREATE INDEX "admin_sessions_user_id_revoked_at_idx" ON "admin_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "admin_login_audits_email_created_at_idx" ON "admin_login_audits"("email", "created_at");

-- CreateIndex
CREATE INDEX "admin_login_audits_user_id_created_at_idx" ON "admin_login_audits"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_refresh_token_id_fkey" FOREIGN KEY ("refresh_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_login_audits" ADD CONSTRAINT "admin_login_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default admin settings
INSERT INTO "admin_settings" ("id", "max_failed_attempts", "lockout_minutes", "updated_at")
VALUES ('default', 10, 30, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
