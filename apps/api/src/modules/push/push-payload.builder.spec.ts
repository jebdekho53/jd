import {
  buildBuyerPushPayload,
  resolvePushClickUrl,
  serializePushPayload,
} from './push-payload.builder';

describe('push-payload.builder', () => {
  it('maps order notifications to tracking route', () => {
    expect(resolvePushClickUrl('ORDER_ACCEPTED', { orderId: 'o-1' })).toBe('/orders/o-1/track');
    expect(resolvePushClickUrl('DELIVERED', { orderId: 'o-2' })).toBe('/orders/o-2/track');
  });

  it('maps wallet, offer, and support routes', () => {
    expect(resolvePushClickUrl('WALLET_CREDITED', {})).toBe('/wallet');
    expect(resolvePushClickUrl('OFFER_AVAILABLE', {})).toBe('/offers');
    expect(resolvePushClickUrl('SUPPORT_REPLY', {})).toBe('/profile/support');
  });

  it('serializes payload for web push', () => {
    const payload = buildBuyerPushPayload('ORDER_PLACED', {
      title: 'Order placed',
      body: 'Thanks for your order',
      orderId: 'o-1',
    });
    const parsed = JSON.parse(serializePushPayload(payload));
    expect(parsed.data.url).toBe('/orders/o-1/track');
    expect(parsed.title).toBe('Order placed');
  });
});
