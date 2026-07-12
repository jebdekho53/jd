'use client';

import {
  REALTIME_NAMESPACES,
  WHATSAPP_EVENTS,
  useRealtime,
  type RoomScope,
} from '@jebdekho/realtime';

interface Handlers {
  onMessageReceived: () => void;
  onStatusUpdated: () => void;
}

const INBOX_SCOPES: RoomScope[] = [{ type: 'whatsapp-inbox' }];

/**
 * Live admin inbox over the `/whatsapp` namespace.
 *
 * Returns whether the socket is currently up, so the caller can keep polling
 * as a fallback when it is not.
 */
export function useWhatsAppInboxSocket({ onMessageReceived, onStatusUpdated }: Handlers): boolean {
  const { connected } = useRealtime({
    namespace: REALTIME_NAMESPACES.whatsapp,
    scopes: INBOX_SCOPES,
    on: {
      [WHATSAPP_EVENTS.MESSAGE_RECEIVED]: onMessageReceived,
      [WHATSAPP_EVENTS.MESSAGE_STATUS_UPDATED]: onStatusUpdated,
    },
  });

  return connected;
}
