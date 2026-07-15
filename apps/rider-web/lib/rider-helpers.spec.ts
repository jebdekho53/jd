import {
  normalizeLocationPayload,
  riderCodSubmitPayload,
  riderOrderActionPath,
  riderSupportTicketPath,
  validateRiderDocumentFile,
} from './rider-helpers';

describe('rider helpers', () => {
  it('builds order action paths with orderId and reject verb', () => {
    expect(riderOrderActionPath('order-123', 'accept')).toBe('/api/rider/orders/order-123/accept');
    expect(riderOrderActionPath('order-123', 'reject')).toBe('/api/rider/orders/order-123/reject');
    expect(riderOrderActionPath('order-123', 'reject')).not.toContain('/failed');
  });

  it('normalizes location payload to latitude and longitude', () => {
    expect(normalizeLocationPayload({ latitude: 28.61, longitude: 77.2, accuracy: 12 })).toEqual({
      latitude: 28.61,
      longitude: 77.2,
      accuracy: 12,
    });
    expect(normalizeLocationPayload({ latitude: 28.61, longitude: 77.2 })).not.toHaveProperty('lat');
    expect(normalizeLocationPayload({ latitude: 28.61, longitude: 77.2 })).not.toHaveProperty('lng');
  });

  it('builds support and COD request shapes', () => {
    expect(riderSupportTicketPath()).toBe('/api/rider/support/tickets');
    expect(riderSupportTicketPath('ticket-1')).toBe('/api/rider/support/tickets/ticket-1');
    expect(riderSupportTicketPath('ticket-1', 'reply')).toBe('/api/rider/support/tickets/ticket-1/reply');
    expect(riderCodSubmitPayload(['order-1'], 450, 'Deposited')).toEqual({
      orderIds: ['order-1'],
      amountDeposited: 450,
      notes: 'Deposited',
    });
  });

  it('validates rider KYC upload files', () => {
    expect(() =>
      validateRiderDocumentFile({ name: 'licence.png', type: 'image/png', size: 1024 } as File),
    ).not.toThrow();
    expect(() =>
      validateRiderDocumentFile({ name: 'licence.exe', type: 'application/x-msdownload', size: 1024 } as File),
    ).toThrow('Upload JPG, PNG, WEBP, or PDF documents only.');
    expect(() =>
      validateRiderDocumentFile({ name: 'large.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 } as File),
    ).toThrow('Document must be 5 MB or smaller.');
  });
});
