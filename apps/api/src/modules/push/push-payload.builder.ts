import type { BuyerPushKind } from './buyer-push.events';

export interface BuyerPushPayloadData {
  kind: BuyerPushKind;
  url: string;
  orderId?: string;
  ticketId?: string;
  offerId?: string;
}

export interface BuyerPushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data: BuyerPushPayloadData;
}

const DEFAULT_ICON = '/pwa/icons/icon-192.png';
const DEFAULT_BADGE = '/pwa/icons/icon-72.png';

export function resolvePushClickUrl(kind: BuyerPushKind, ids: Record<string, string | undefined>): string {
  switch (kind) {
    case 'ORDER_PLACED':
    case 'ORDER_ACCEPTED':
    case 'READY_FOR_PICKUP':
    case 'RIDER_ASSIGNED':
    case 'OUT_FOR_DELIVERY':
    case 'DELIVERED':
      return ids.orderId ? `/orders/${ids.orderId}/track` : '/orders';
    case 'OFFER_AVAILABLE':
      return '/offers';
    case 'WALLET_CREDITED':
      return '/wallet';
    case 'SUPPORT_REPLY':
      return '/profile/support';
    default:
      return '/';
  }
}

export function buildBuyerPushPayload(
  kind: BuyerPushKind,
  input: {
    title: string;
    body: string;
    orderId?: string;
    ticketId?: string;
    offerId?: string;
    image?: string;
  },
): BuyerPushNotificationPayload {
  const url = resolvePushClickUrl(kind, {
    orderId: input.orderId,
    ticketId: input.ticketId,
    offerId: input.offerId,
  });

  return {
    title: input.title,
    body: input.body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    image: input.image,
    tag: `${kind}:${input.orderId ?? input.ticketId ?? input.offerId ?? 'general'}`,
    data: {
      kind,
      url,
      orderId: input.orderId,
      ticketId: input.ticketId,
      offerId: input.offerId,
    },
  };
}

export function serializePushPayload(payload: BuyerPushNotificationPayload): string {
  return JSON.stringify(payload);
}
