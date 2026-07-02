import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderExpiryService, ORDER_EXPIRY_AFTER_MS } from './order-expiry.service';

type OrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  payment: { status: PaymentStatus } | null;
  providerShipment: { id: string } | null;
};

function buildOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: 'order_1',
    orderNumber: 'JD-1',
    status: OrderStatus.PAYMENT_PENDING,
    paymentMethod: PaymentMethod.RAZORPAY,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: new Date(Date.now() - ORDER_EXPIRY_AFTER_MS - 60_000), // 3h + 1m old
    payment: { status: PaymentStatus.PENDING },
    providerShipment: null,
    ...overrides,
  };
}

describe('OrderExpiryService', () => {
  let service: OrderExpiryService;
  let order: OrderRow | null;

  const prisma = {
    order: {
      findUnique: jest.fn(async () => order),
      findMany: jest.fn(async () => (order ? [{ id: order.id }] : [])),
    },
    payment: { updateMany: jest.fn(async () => ({ count: 1 })) },
  };
  const reservations = { releaseOrderReservations: jest.fn(async () => undefined) };
  const statusHistory = { transition: jest.fn(async () => true) };
  const orderCache = { invalidateAll: jest.fn(async () => undefined) };
  const lock = {
    runExclusive: jest.fn(async (_k: string, _t: number, fn: () => Promise<void>) => {
      await fn();
      return true;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    order = buildOrder();
    service = new OrderExpiryService(
      prisma as never,
      reservations as never,
      statusHistory as never,
      orderCache as never,
      lock as never,
    );
  });

  it('expires an unpaid, non-COD order older than 3 hours', async () => {
    const result = await service.expireOne('order_1');

    expect(result).toBe(true);
    expect(reservations.releaseOrderReservations).toHaveBeenCalledWith('order_1');
    expect(statusHistory.transition).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order_1', toStatus: OrderStatus.EXPIRED }),
    );
    // Dangling payment intent is failed, not refunded.
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'order_1', status: PaymentStatus.PENDING },
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      }),
    );
  });

  it('releases reserved inventory when an order expires', async () => {
    await service.expireOne('order_1');
    expect(reservations.releaseOrderReservations).toHaveBeenCalledTimes(1);
    expect(reservations.releaseOrderReservations).toHaveBeenCalledWith('order_1');
  });

  it('does NOT touch a COD order even if old and unpaid', async () => {
    order = buildOrder({ paymentMethod: PaymentMethod.COD });
    const result = await service.expireOne('order_1');

    expect(result).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
    expect(reservations.releaseOrderReservations).not.toHaveBeenCalled();
  });

  it('does NOT touch a WALLET_COD order', async () => {
    order = buildOrder({ paymentMethod: PaymentMethod.WALLET_COD });
    expect(await service.expireOne('order_1')).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
  });

  it('does NOT touch an order younger than 3 hours', async () => {
    order = buildOrder({ createdAt: new Date(Date.now() - 60 * 60 * 1000) }); // 1h old
    const result = await service.expireOne('order_1');

    expect(result).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
    expect(reservations.releaseOrderReservations).not.toHaveBeenCalled();
  });

  it('does NOT touch an order with a recorded payment success (order-level)', async () => {
    order = buildOrder({ paymentStatus: PaymentStatus.PAID });
    expect(await service.expireOne('order_1')).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
  });

  it('does NOT touch an order whose payment record is PAID even if status not yet synced', async () => {
    order = buildOrder({
      status: OrderStatus.PAYMENT_PENDING,
      paymentStatus: PaymentStatus.PENDING,
      payment: { status: PaymentStatus.PAID },
    });
    const result = await service.expireOne('order_1');

    expect(result).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
    expect(reservations.releaseOrderReservations).not.toHaveBeenCalled();
  });

  it('does NOT touch an order that already advanced past PAYMENT_PENDING', async () => {
    order = buildOrder({ status: OrderStatus.MERCHANT_ACCEPTED });
    expect(await service.expireOne('order_1')).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
  });

  it('does NOT touch an order that already has a provider shipment', async () => {
    order = buildOrder({ providerShipment: { id: 'ship_1' } });
    expect(await service.expireOne('order_1')).toBe(false);
    expect(statusHistory.transition).not.toHaveBeenCalled();
  });

  it('runs under a distributed lock and counts expiries', async () => {
    await service.expireUnpaidOrders();
    expect(lock.runExclusive).toHaveBeenCalledWith(
      'cron:order-expiry',
      expect.any(Number),
      expect.any(Function),
    );
    expect(statusHistory.transition).toHaveBeenCalledTimes(1);
  });
});
