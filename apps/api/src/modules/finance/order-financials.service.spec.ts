import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderFinancialsService } from './order-financials.service';

const mockLedger = {
  recordOrderPayment: jest.fn().mockResolvedValue(undefined),
  recordTaxAccrual: jest.fn().mockResolvedValue(undefined),
};
const mockCommission = { resolveForOrder: jest.fn().mockResolvedValue({ commissionPercent: 10, commissionRuleId: 'r1' }) };
const mockPrisma: {
  orderFinancialSnapshot: { findUnique: jest.Mock; create: jest.Mock };
  store: { findUnique: jest.Mock };
  $transaction: jest.Mock;
  taxRecord: { create: jest.Mock };
  order: { findUnique: jest.Mock };
} = {
  orderFinancialSnapshot: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  },
  store: { findUnique: jest.fn().mockResolvedValue({ id: 's1', name: 'Store', slug: 'store', deliveryFee: 0, minOrderAmount: 0, cityId: 'c1' }) },
  $transaction: jest.fn(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma)),
  taxRecord: { create: jest.fn() },
  order: { findUnique: jest.fn() },
};

describe('OrderFinancialsService', () => {
  const service = new OrderFinancialsService(
    mockPrisma as never,
    mockCommission as never,
    mockLedger as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockLedger.recordOrderPayment.mockResolvedValue(undefined);
    mockLedger.recordTaxAccrual.mockResolvedValue(undefined);
  });

  it('defers ledger for Razorpay orders at create', async () => {
    await service.freezeOnOrderCreate({
      orderId: 'o1',
      storeId: 's1',
      subtotal: 100,
      discountAmount: 0,
      deliveryFee: 20,
      paymentMethod: PaymentMethod.RAZORPAY,
    });
    expect(mockLedger.recordOrderPayment).not.toHaveBeenCalled();
  });

  it('posts ledger for COD at create', async () => {
    await service.freezeOnOrderCreate({
      orderId: 'o2',
      storeId: 's1',
      subtotal: 100,
      discountAmount: 0,
      deliveryFee: 20,
      paymentMethod: PaymentMethod.COD,
    });
    expect(mockLedger.recordOrderPayment).toHaveBeenCalledWith('o2', expect.any(Number), true);
  });

  it('records online payment on verify', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.PAID,
      totalAmount: 120,
      deliveryFee: 20,
      discountAmount: 0,
      taxAmount: 5,
    });
    mockPrisma.orderFinancialSnapshot.findUnique.mockResolvedValue(null);

    await service.recordOnlinePaymentConfirmed('o3');
    expect(mockLedger.recordOrderPayment).toHaveBeenCalledWith('o3', expect.any(Number), false);
  });
});
