export type BuyerPushKind = 'ORDER_PLACED' | 'ORDER_ACCEPTED' | 'READY_FOR_PICKUP' | 'RIDER_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'WALLET_CREDITED' | 'SUPPORT_REPLY' | 'OFFER_AVAILABLE';
export declare const BUYER_PUSH_EVENTS: {
    readonly ORDER_PLACED: "buyer.push.order_placed";
    readonly ORDER_ACCEPTED: "buyer.push.order_accepted";
    readonly READY_FOR_PICKUP: "buyer.push.ready_for_pickup";
    readonly RIDER_ASSIGNED: "buyer.push.rider_assigned";
    readonly OUT_FOR_DELIVERY: "buyer.push.out_for_delivery";
    readonly DELIVERED: "buyer.push.delivered";
    readonly WALLET_CREDITED: "buyer.push.wallet_credited";
    readonly SUPPORT_REPLY: "buyer.push.support_reply";
    readonly OFFER_AVAILABLE: "buyer.push.offer_available";
};
export interface BuyerPushSupportReplyEvent {
    userId: string;
    ticketId: string;
    ticketNumber: string;
}
