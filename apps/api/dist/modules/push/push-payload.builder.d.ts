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
export declare function resolvePushClickUrl(kind: BuyerPushKind, ids: Record<string, string | undefined>): string;
export declare function buildBuyerPushPayload(kind: BuyerPushKind, input: {
    title: string;
    body: string;
    orderId?: string;
    ticketId?: string;
    offerId?: string;
    image?: string;
}): BuyerPushNotificationPayload;
export declare function serializePushPayload(payload: BuyerPushNotificationPayload): string;
