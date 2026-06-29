"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePushClickUrl = resolvePushClickUrl;
exports.buildBuyerPushPayload = buildBuyerPushPayload;
exports.serializePushPayload = serializePushPayload;
const DEFAULT_ICON = '/pwa/icons/icon-192.png';
const DEFAULT_BADGE = '/pwa/icons/icon-72.png';
function resolvePushClickUrl(kind, ids) {
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
function buildBuyerPushPayload(kind, input) {
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
function serializePushPayload(payload) {
    return JSON.stringify(payload);
}
//# sourceMappingURL=push-payload.builder.js.map