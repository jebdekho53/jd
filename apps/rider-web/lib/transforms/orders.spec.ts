import { mapDeliveryDetail, mapDeliveryListItem, type BackendDelivery } from './orders';

function backend(overrides: Partial<BackendDelivery> = {}): BackendDelivery {
  return {
    id: 'del1',
    orderId: 'ord1',
    status: 'ARRIVED_AT_CUSTOMER',
    assignedAt: '2026-07-16T10:00:00.000Z',
    pickedUpAt: null,
    deliveredAt: null,
    pickupLat: 28.6,
    pickupLng: 77.2,
    deliveryLat: 28.61,
    deliveryLng: 77.21,
    distanceKm: 2.4,
    estimatedMins: 12,
    riderEarning: '45.00',
    createdAt: '2026-07-16T09:59:00.000Z',
    order: {
      id: 'ord1',
      orderNumber: 'JD-1',
      status: 'OUT_FOR_DELIVERY',
      paymentMethod: 'COD',
      totalAmount: '250.00',
      deliveryAddress: { line1: '42 MG Road', city: 'Delhi' },
      store: { id: 'store1', name: 'Test Store', latitude: 28.6, longitude: 77.2, phone: null },
      items: [],
    },
    ...overrides,
  };
}

describe('rider delivery transforms', () => {
  it('passes rider-safe handover flags through to the mobile contract', () => {
    const mapped = mapDeliveryDetail(
      backend({
        pickupOtpRequired: true,
        pickupVerified: true,
        deliveryOtpRequired: true,
        deliveryVerified: false,
        codDue: true,
        codAmount: '250.00',
      }),
    );
    expect(mapped.pickupOtpRequired).toBe(true);
    expect(mapped.pickupVerified).toBe(true);
    expect(mapped.deliveryOtpRequired).toBe(true);
    expect(mapped.deliveryVerified).toBe(false);
    expect(mapped.codDue).toBe(true);
    expect(mapped.codAmount).toBe('250.00');
  });

  it('never leaks a raw pickup/delivery OTP to the rider payload', () => {
    // Even if the backend accidentally sent raw codes, the transform must not
    // surface them. The mapped object is built from an explicit allow-list.
    const dirty = backend() as BackendDelivery & Record<string, unknown>;
    dirty.pickupOtp = '4821';
    dirty.deliveryOtp = '7390';
    const mapped = mapDeliveryDetail(dirty) as Record<string, unknown>;
    expect(mapped.pickupOtp).toBeUndefined();
    expect(mapped.deliveryOtp).toBeUndefined();
  });

  it('defaults handover flags for legacy deliveries with no OTP metadata', () => {
    const mapped = mapDeliveryListItem(backend());
    expect(mapped.pickupOtpRequired).toBe(false);
    expect(mapped.deliveryOtpRequired).toBe(false);
    expect(mapped.codDue).toBe(false);
    expect(mapped.codAmount).toBeNull();
  });
});
