import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  OrderClaimStatus,
  OrderClaimType,
  OrderStatus,
  PaymentStatus,
  ReturnClaimReason,
} from '@prisma/client';
import { OrderClaimService } from './order-claim.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { ClaimRefundService } from './claim-refund.service';
import { ClaimReplacementService } from './claim-replacement.service';
import { ClaimNotificationService } from './claim-notification.service';
import { ReturnPickupService } from './return-pickup.service';

describe('OrderClaimService security guards', () => {
  let service: OrderClaimService;

  const prisma = {
    orderClaim: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    order: { findFirst: jest.fn(), count: jest.fn() },
    store: { findFirst: jest.fn(), findMany: jest.fn() },
    orderClaimItem: { groupBy: jest.fn() },
    claimRefund: { aggregate: jest.fn() },
    claimReplacement: { count: jest.fn() },
    product: { findMany: jest.fn() },
    merchantProfile: { update: jest.fn() },
    $transaction: jest.fn(),
  } as any;
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));

  const merchantService = {
    requireMerchantProfile: jest.fn().mockResolvedValue({ id: 'mp-1' }),
  };

  const eligibility = {
    productToPolicy: jest.fn().mockReturnValue({
      isReturnable: false,
      isRefundable: true,
      isReplaceable: false,
      returnWindowHours: 72,
      approvalMode: 'MANUAL',
      proofRequired: 'NONE',
      autoApproveBelowAmount: null,
      returnReasons: [],
      restockingFee: 0,
      refundMethod: 'ORIGINAL_PAYMENT',
      returnPolicyText: null,
      replacementPolicyText: null,
      preparedFoodPolicy: null,
      allowCustomerChangedMind: false,
    }),
    validateEvidence: jest.fn().mockReturnValue(null),
    appendHistory: jest.fn(),
    getActiveClaimedQuantities: jest.fn().mockResolvedValue(new Map()),
    getOrderEligibility: jest.fn(),
  };

  const claimRefund = { processRefund: jest.fn() };
  const claimReplacement = { issueReplacement: jest.fn() };
  const notifications = {
    notifyClaimSubmitted: jest.fn(),
    notifyClaimStatus: jest.fn(),
  };

  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'UPLOAD_PUBLIC_URL') return 'https://api.jebdekho.com/uploads';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderClaimService,
        { provide: PrismaService, useValue: prisma },
        { provide: MerchantService, useValue: merchantService },
        { provide: ClaimEligibilityService, useValue: eligibility },
        { provide: ClaimRefundService, useValue: claimRefund },
        { provide: ClaimReplacementService, useValue: claimReplacement },
        { provide: ClaimNotificationService, useValue: notifications },
        { provide: ConfigService, useValue: config },
        { provide: ReturnPickupService, useValue: { scheduleForClaim: jest.fn() } },
      ],
    }).compile();
    service = module.get(OrderClaimService);
  });

  it('returns NotFound when merchant queries foreign storeId', async () => {
    prisma.store.findFirst.mockResolvedValue(null);

    await expect(
      service.listMerchantClaims('merchant-user', { storeId: 'foreign-store' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not return another buyer claim via idempotency key', async () => {
    prisma.orderClaim.findFirst.mockResolvedValue(null);
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord-1',
      storeId: 'store-1',
      completedAt: new Date(),
      buyerProfile: { id: 'bp-2', userId: 'buyer-b' },
      delivery: { deliveredAt: new Date() },
      items: [
        {
          id: 'oi-1',
          productId: 'p1',
          productName: 'Milk',
          quantity: 2,
          unitPrice: 50,
          product: {},
        },
      ],
    });
    eligibility.getActiveClaimedQuantities.mockResolvedValue(new Map());

    prisma.orderClaim.create.mockResolvedValue({
      id: 'claim-new',
      claimNumber: 'CLM-1',
      orderId: 'ord-1',
      claimType: OrderClaimType.REFUND,
      status: OrderClaimStatus.PENDING,
      reason: ReturnClaimReason.DAMAGED,
      requestedAmount: 50,
      approvedAmount: null,
      restockingFee: 0,
      items: [],
      evidence: [],
      history: [],
      refund: null,
      replacement: null,
      order: { orderNumber: 'JD-1', status: OrderStatus.DELIVERED },
    });

    await service.createBuyerClaim('buyer-b', 'ord-1', {
      claimType: OrderClaimType.REFUND,
      reason: ReturnClaimReason.DAMAGED,
      items: [{ orderItemId: 'oi-1', quantity: 1 }],
      idempotencyKey: 'shared-key-12345678',
    });

    expect(prisma.orderClaim.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idempotencyKey: 'shared-key-12345678',
          buyerProfile: { userId: 'buyer-b' },
        }),
      }),
    );
  });

  it('throws Conflict when same buyer reuses idempotency key on different order', async () => {
    prisma.orderClaim.findFirst.mockResolvedValue({
      id: 'claim-1',
      orderId: 'other-order',
      claimNumber: 'CLM-9',
      items: [],
      evidence: [],
      history: [],
      refund: null,
      replacement: null,
      order: {},
    });

    await expect(
      service.createBuyerClaim('buyer-a', 'ord-1', {
        claimType: OrderClaimType.REFUND,
        reason: ReturnClaimReason.DAMAGED,
        items: [{ orderItemId: 'oi-1', quantity: 1 }],
        idempotencyKey: 'reuse-key-12345678',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects duplicate claimed quantity', async () => {
    prisma.orderClaim.findFirst.mockResolvedValue(null);
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord-1',
      storeId: 'store-1',
      completedAt: new Date(),
      buyerProfile: { id: 'bp-1', userId: 'buyer-a' },
      delivery: { deliveredAt: new Date() },
      items: [
        {
          id: 'oi-1',
          productId: 'p1',
          productName: 'Milk',
          quantity: 2,
          unitPrice: 50,
          product: {},
        },
      ],
    });
    eligibility.getActiveClaimedQuantities.mockResolvedValue(new Map([['oi-1', 2]]));

    await expect(
      service.createBuyerClaim('buyer-a', 'ord-1', {
        claimType: OrderClaimType.REFUND,
        reason: ReturnClaimReason.DAMAGED,
        items: [{ orderItemId: 'oi-1', quantity: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects re-approve on terminal refund claim', async () => {
    const terminalClaim = {
      id: 'claim-1',
      claimNumber: 'CLM-1',
      status: OrderClaimStatus.REFUND_PROCESSED,
      requestedAmount: 100,
      returnPickupEnabled: false,
      storeId: 'store-1',
      order: { buyerProfile: { userId: 'buyer-1' } },
      refund: { status: PaymentStatus.REFUNDED },
      replacement: null,
    };

    prisma.orderClaim.findFirst.mockResolvedValue(terminalClaim);
    prisma.orderClaim.findUnique.mockResolvedValue(terminalClaim);

    await expect(
      service.patchMerchantClaim('merchant-1', 'claim-1', {
        action: 'APPROVE_REFUND',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects external evidence URLs', async () => {
    prisma.orderClaim.findFirst.mockResolvedValue(null);
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord-1',
      storeId: 'store-1',
      completedAt: new Date(),
      buyerProfile: { id: 'bp-1', userId: 'buyer-a' },
      delivery: { deliveredAt: new Date() },
      items: [
        {
          id: 'oi-1',
          productId: 'p1',
          productName: 'Milk',
          quantity: 1,
          unitPrice: 50,
          product: {},
        },
      ],
    });
    eligibility.getActiveClaimedQuantities.mockResolvedValue(new Map());

    await expect(
      service.createBuyerClaim('buyer-a', 'ord-1', {
        claimType: OrderClaimType.REFUND,
        reason: ReturnClaimReason.DAMAGED,
        items: [{ orderItemId: 'oi-1', quantity: 1 }],
        evidence: [{ kind: 'PHOTO', url: 'https://evil.example/steal.jpg' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
