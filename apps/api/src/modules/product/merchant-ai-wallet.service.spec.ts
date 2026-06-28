import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MerchantAiWalletTransactionStatus,
  MerchantAiWalletTransactionType,
} from '@prisma/client';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { AuditService } from '../audit/audit.service';

const MERCHANT_ID = 'mp1';
const STORE_ID = 'store1';
const ANALYSIS_ID = 'analysis1';
const USER_ID = 'user1';

const mockPrisma = {
  $transaction: jest.fn(),
  merchantAiWallet: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  merchantAiWalletTransaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  merchantProfile: { findUnique: jest.fn() },
  aIProductAnalysis: { updateMany: jest.fn() },
};

const mockRazorpay = {
  isConfigured: jest.fn().mockReturnValue(true),
  createOrder: jest.fn(),
  verifyPaymentSignature: jest.fn(),
  keyId: 'rzp_test',
};

const mockAudit = { log: jest.fn() };

describe('MerchantAiWalletService', () => {
  let service: MerchantAiWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantAiWalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpay },
        { provide: AuditService, useValue: mockAudit },
        { provide: ConfigService, useValue: {
            get: jest.fn((k: string, d?: unknown) => {
              if (k === 'AI_WALLET_MIN_RECHARGE_PAISE') return 10000;
              if (k === 'AI_PRODUCT_ANALYSIS_PRICE_PAISE') return 150;
              return d;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(MerchantAiWalletService);
    jest.clearAllMocks();
    mockRazorpay.isConfigured.mockReturnValue(true);
    mockAudit.log.mockResolvedValue(undefined);
  });

  it('rejects recharge below minimum ₹100', async () => {
    await expect(service.createRechargeOrder(MERCHANT_ID, 5000, USER_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects invalid Razorpay signature on verify', async () => {
    mockRazorpay.verifyPaymentSignature.mockReturnValue(false);
    await expect(
      service.verifyRecharge(MERCHANT_ID, 'order1', 'pay1', 'bad', USER_ID),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('credits wallet once on successful verify', async () => {
    mockRazorpay.verifyPaymentSignature.mockReturnValue(true);
    mockPrisma.merchantAiWalletTransaction.findFirst.mockResolvedValue({
      id: 'tx1',
      merchantProfileId: MERCHANT_ID,
      amountPaise: 10000,
      status: MerchantAiWalletTransactionStatus.PENDING,
    });
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        merchantAiWalletTransaction: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'tx1',
            status: MerchantAiWalletTransactionStatus.PENDING,
            amountPaise: 10000,
          }),
          update: jest.fn(),
        },
        merchantAiWallet: {
          upsert: jest.fn().mockResolvedValue({ balancePaise: 10000 }),
          findUnique: jest.fn(),
        },
      };
      return cb(tx);
    });

    const result = await service.verifyRecharge(
      MERCHANT_ID,
      'order1',
      'pay1',
      'sig',
      USER_ID,
    );
    expect(result.success).toBe(true);
    expect(result.balancePaise).toBe(10000);
  });

  it('returns 402 when balance insufficient for debit', async () => {
    mockPrisma.merchantAiWalletTransaction.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        merchantAiWallet: {
          upsert: jest.fn().mockResolvedValue({ balancePaise: 100, merchantProfileId: MERCHANT_ID }),
          update: jest.fn(),
        },
        merchantAiWalletTransaction: { create: jest.fn() },
      };
      return cb(tx);
    });

    await expect(
      service.debitForProductCreation(MERCHANT_ID, STORE_ID, ANALYSIS_ID, USER_ID),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('debits ₹1.50 idempotently', async () => {
    const key = service.buildDebitIdempotencyKey(MERCHANT_ID, STORE_ID, ANALYSIS_ID);
    mockPrisma.merchantAiWalletTransaction.findUnique.mockResolvedValue({
      id: 'existing',
      amountPaise: 150,
      status: MerchantAiWalletTransactionStatus.SUCCESS,
      idempotencyKey: key,
    });

    const result = await service.debitForProductCreation(
      MERCHANT_ID,
      STORE_ID,
      ANALYSIS_ID,
      USER_ID,
    );
    expect(result.charged).toBe(false);
    expect(result.amountPaise).toBe(150);
  });

  it('returns idempotent result on duplicate verify without double credit', async () => {
    mockRazorpay.verifyPaymentSignature.mockReturnValue(true);
    mockPrisma.merchantAiWalletTransaction.findFirst.mockResolvedValue({
      id: 'tx1',
      merchantProfileId: MERCHANT_ID,
      amountPaise: 10000,
      status: MerchantAiWalletTransactionStatus.SUCCESS,
    });
    mockPrisma.merchantAiWallet.upsert.mockResolvedValue({ balancePaise: 10000 });

    const result = await service.verifyRecharge(
      MERCHANT_ID,
      'order1',
      'pay1',
      'sig',
      USER_ID,
    );
    expect(result.alreadyProcessed).toBe(true);
    expect(result.balancePaise).toBe(10000);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('refunds debit on product creation failure', async () => {
    const debitKey = service.buildDebitIdempotencyKey(MERCHANT_ID, STORE_ID, ANALYSIS_ID);
    mockPrisma.merchantAiWalletTransaction.findUnique
      .mockResolvedValueOnce({
        id: 'debit1',
        status: MerchantAiWalletTransactionStatus.SUCCESS,
        amountPaise: 150,
        idempotencyKey: debitKey,
      })
      .mockResolvedValueOnce(null);

    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        merchantAiWallet: {
          findUnique: jest.fn().mockResolvedValue({ balancePaise: 9850, merchantProfileId: MERCHANT_ID }),
          update: jest.fn().mockResolvedValue({ balancePaise: 10000 }),
        },
        merchantAiWalletTransaction: {
          create: jest.fn(),
          update: jest.fn(),
        },
      };
      return cb(tx);
    });
    mockPrisma.aIProductAnalysis.updateMany.mockResolvedValue({ count: 1 });

    await service.refundOnProductCreationFailure(
      MERCHANT_ID,
      STORE_ID,
      ANALYSIS_ID,
      'Product creation failed',
      USER_ID,
    );

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.aIProductAnalysis.updateMany).toHaveBeenCalled();
  });
});
