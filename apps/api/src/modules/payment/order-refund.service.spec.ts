import { Test, TestingModule } from '@nestjs/testing';
import { OrderRefundService } from './order-refund.service';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from './razorpay.service';
import { LedgerService } from '../finance/ledger.service';
import { RewardService } from '../wallet-loyalty/reward.service';
import { CreditNoteService } from '../compliance/credit-note.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FinanceAlertService } from '../finance/finance-alert.service';
import {
  OrderRefundInitiator,
  OrderRefundStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

const mockPrisma = {
  order: { findUnique: jest.fn() },
  orderRefund: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  payment: { findUnique: jest.fn(), update: jest.fn() },
  paymentTransaction: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn((ops) => Promise.all(ops)),
};

describe('OrderRefundService', () => {
  let service: OrderRefundService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRefundService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: { isConfigured: () => true, createRefund: jest.fn() } },
        { provide: LedgerService, useValue: { recordRefund: jest.fn() } },
        { provide: RewardService, useValue: { refundWalletForOrder: jest.fn() } },
        { provide: CreditNoteService, useValue: { createForRefund: jest.fn() } },
        { provide: EmailNotificationService, useValue: { sendRefundInitiated: jest.fn(), sendRefundProcessed: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: DomainEventsService, useValue: { emit: jest.fn() } },
        { provide: FinanceAlertService, useValue: { raiseRefundFailed: jest.fn() } },
      ],
    }).compile();
    service = module.get(OrderRefundService);
    jest.clearAllMocks();
  });

  it('rejects refund when order is not PAID', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.RAZORPAY,
      payment: null,
      buyerProfile: { wallet: null },
    });
    await expect(
      service.initiateRefund({
        orderId: 'o1',
        actorId: 'u1',
        initiatorType: OrderRefundInitiator.BUYER,
      }),
    ).rejects.toThrow('not in a refundable payment state');
  });

  it('returns existing refund when already REFUNDED', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      paymentStatus: PaymentStatus.REFUNDED,
      paymentMethod: PaymentMethod.RAZORPAY,
      payment: null,
      buyerProfile: { wallet: null },
    });
    mockPrisma.orderRefund.findFirst.mockResolvedValue({
      id: 'r1',
      status: OrderRefundStatus.REFUNDED,
    });
    const result = await service.initiateRefund({
      orderId: 'o1',
      actorId: 'u1',
      initiatorType: OrderRefundInitiator.BUYER,
    });
    expect(result.refundId).toBe('r1');
    expect(result.status).toBe(OrderRefundStatus.REFUNDED);
  });
});
