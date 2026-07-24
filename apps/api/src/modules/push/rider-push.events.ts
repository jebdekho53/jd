/**
 * Push kinds a delivery partner can receive.
 *
 * DELIVERY_OFFERED is the one that matters: an offer expires on a timer, so a
 * rider who does not see it loses the work. It is treated as operational and is
 * not gated on a preference.
 */
export type RiderPushKind =
  | 'DELIVERY_OFFERED'
  | 'DELIVERY_REASSIGNED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'PAYOUT_SENT'
  | 'COD_REMINDER'
  | 'SUPPORT_REPLY';

export interface RiderPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data: {
    kind: RiderPushKind;
    url: string;
    orderId?: string;
    ticketId?: string;
  };
}

const ICON = '/icon-192.png';

export function riderPushClickUrl(kind: RiderPushKind, ids: { orderId?: string; ticketId?: string }): string {
  switch (kind) {
    case 'DELIVERY_OFFERED':
    case 'DELIVERY_REASSIGNED':
      return ids.orderId ? `/orders/${ids.orderId}` : '/orders';
    case 'KYC_APPROVED':
    case 'KYC_REJECTED':
      return '/onboarding/status';
    case 'PAYOUT_SENT':
      return '/earnings';
    case 'COD_REMINDER':
      return '/cod';
    case 'SUPPORT_REPLY':
      return ids.ticketId ? `/support/${ids.ticketId}` : '/support';
    default:
      return '/home';
  }
}

export function buildRiderPush(
  kind: RiderPushKind,
  title: string,
  body: string,
  ids: { orderId?: string; ticketId?: string } = {},
): RiderPushPayload {
  return {
    title,
    body,
    icon: ICON,
    badge: ICON,
    // Tag by kind so a second offer replaces the first in the tray rather than
    // stacking — a rider can only act on one offer at a time.
    tag: `rider-${kind.toLowerCase()}`,
    requireInteraction: kind === 'DELIVERY_OFFERED',
    data: { kind, url: riderPushClickUrl(kind, ids), ...ids },
  };
}
