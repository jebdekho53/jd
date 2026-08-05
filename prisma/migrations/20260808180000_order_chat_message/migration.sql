-- Lightweight in-order chat between a buyer and their assigned rider during
-- an active delivery (Swiggy-style), separate from OrderClaim/SupportTicket.
DO $$ BEGIN
  CREATE TYPE "ChatSenderType" AS ENUM ('BUYER', 'RIDER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "order_chat_messages" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "sender_type" "ChatSenderType" NOT NULL,
  "sender_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_chat_messages_order_id_created_at_idx"
  ON "order_chat_messages" ("order_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "order_chat_messages"
    ADD CONSTRAINT "order_chat_messages_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
