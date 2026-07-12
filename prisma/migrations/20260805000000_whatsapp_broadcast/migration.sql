-- CreateEnum
CREATE TYPE "WhatsAppBroadcastMode" AS ENUM ('TEXT', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "WhatsAppBroadcastStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppBroadcastRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "whatsapp_broadcasts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "WhatsAppBroadcastMode" NOT NULL,
    "body_template" TEXT,
    "template_name" TEXT,
    "template_lang" TEXT,
    "template_params" TEXT[],
    "status" "WhatsAppBroadcastStatus" NOT NULL DEFAULT 'QUEUED',
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_broadcast_recipients" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "wa_id" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "status" "WhatsAppBroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "wa_message_id" TEXT,
    "error_code" INTEGER,
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_broadcast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_broadcasts_status_created_at_idx" ON "whatsapp_broadcasts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "whatsapp_broadcast_recipients_broadcast_id_status_idx" ON "whatsapp_broadcast_recipients"("broadcast_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_broadcast_recipients_broadcast_id_wa_id_key" ON "whatsapp_broadcast_recipients"("broadcast_id", "wa_id");

-- AddForeignKey
ALTER TABLE "whatsapp_broadcast_recipients" ADD CONSTRAINT "whatsapp_broadcast_recipients_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "whatsapp_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

