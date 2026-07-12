/** Internal event names emitted when the WhatsApp webhook persists something. */
export const WHATSAPP_INBOX_INTERNAL_EVENTS = {
  MESSAGE_RECEIVED: 'whatsapp.message.received',
  MESSAGE_STATUS_UPDATED: 'whatsapp.message.status',
} as const;

/** Socket.IO event names the admin inbox listens for on the `/whatsapp` namespace. */
export const WHATSAPP_INBOX_WS_EVENTS = {
  MESSAGE_RECEIVED: 'whatsapp.message.received',
  MESSAGE_STATUS_UPDATED: 'whatsapp.message.status',
} as const;

export interface WhatsAppMessageReceivedEvent {
  conversationId: string;
  waId: string;
  displayName: string | null;
  text: string | null;
  timestamp: string;
}

export interface WhatsAppMessageStatusEvent {
  waMessageId: string;
  status: string;
}
