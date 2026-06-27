import {
  merchantShipmentPath,
  merchantShipmentCancelPath,
  merchantShipmentRetryPath,
} from './logistics-paths';

describe('merchant logistics BFF paths', () => {
  const orderId = 'ord_abc123';

  it('builds shipment GET path', () => {
    expect(merchantShipmentPath(orderId)).toBe(`/merchant/orders/${orderId}/shipment`);
  });

  it('builds shipment cancel path', () => {
    expect(merchantShipmentCancelPath(orderId)).toBe(`/merchant/orders/${orderId}/shipment/cancel`);
  });

  it('builds shipment retry path', () => {
    expect(merchantShipmentRetryPath(orderId)).toBe(`/merchant/orders/${orderId}/shipment/retry`);
  });
});
