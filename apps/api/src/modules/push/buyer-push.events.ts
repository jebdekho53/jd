export type BuyerPushKind =
  | 'ORDER_PLACED'
  | 'ORDER_ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'WALLET_CREDITED'
  | 'SUPPORT_REPLY'
  | 'OFFER_AVAILABLE';

export const BUYER_PUSH_EVENTS = {
  ORDER_PLACED: 'buyer.push.order_placed',
  ORDER_ACCEPTED: 'buyer.push.order_accepted',
  READY_FOR_PICKUP: 'buyer.push.ready_for_pickup',
  RIDER_ASSIGNED: 'buyer.push.rider_assigned',
  OUT_FOR_DELIVERY: 'buyer.push.out_for_delivery',
  DELIVERED: 'buyer.push.delivered',
  WALLET_CREDITED: 'buyer.push.wallet_credited',
  SUPPORT_REPLY: 'buyer.push.support_reply',
  OFFER_AVAILABLE: 'buyer.push.offer_available',
} as const;

export interface BuyerPushSupportReplyEvent {
  userId: string;
  ticketId: string;
  ticketNumber: string;
}
