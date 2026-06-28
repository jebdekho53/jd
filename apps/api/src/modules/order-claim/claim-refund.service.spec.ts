import { Test, TestingModule } from '@nestjs/testing';
import { ClaimRefundService } from './claim-refund.service';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { LedgerService } from '../finance/ledger.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { CreditNoteService } from '../compliance/credit-note.service';
import { PaymentStatus } from '@prisma/client';

describe('ClaimRefundService idempotency', () => {
  let service: ClaimRefundService;

  const tx = {
    claimRefund: { update: jest.fn() },
    orderClaim: { update: jest.fn() },
  };

  const prisma = {
    orderClaim: { findUnique: jest.fn(), update: jest.fn() },
    claimRefund: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    paymentTransaction: { create: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(tx)),
  };

  const razorpay = {
    isConfigured: jest.fn().mockReturnValue(true),
    createRefund: jest.fn().mockResolvedValue({ id: 'rfnd_1', amount: 10000 }),
  };

  const ledger = {
    recordClaimRefund: jest.fn().mockResolvedValue(undefined),
    recordWalletCredit: jest.fn(),
  };

  const wallet = {
    creditWallet: jest.fn().mockResolvedValue({ id: 'wtxn_1' }),
    emitWalletCredited: jest.fn(),
  };

  const eligibility = {
    appendHistory: jest.fn(),
    productToPolicy: jest.fn().mockReturnValue({ refundMethod: 'ORIGINAL_PAYMENT' }),
  };

  const creditNotes = { createForRefund: jest.fn().mockResolvedValue({}) };

  const baseClaim = {
    id: 'claim-2',
    claimNumber: 'CLM-2',
    approvedAmount: 50,
    requestedAmount: 50,
    buyerProfileId: 'bp1',
    orderId: 'ord-2',
    items: [
      {
        orderItemId: 'oi1',
        quantityClaimed: 1,
        quantityApproved: 1,
        product: {},
      },
    ],
    order: {
      razorpayAmount: 50,
      paymentMethod: 'RAZORPAY',
      payment: { id: 'pay1', razorpayPaymentId: 'rzp_pay' },
      buyerProfile: { wallet: { id: 'w1' } },
    },
    refund: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimRefundService,
        { provide: PrismaService, useValue: prisma },
        { provide: RazorpayService, useValue: razorpay },
        { provide: LedgerService, useValue: ledger },
        { provide: WalletService, useValue: wallet },
        { provide: ClaimEligibilityService, useValue: eligibility },
        { provide: CreditNoteService, useValue: creditNotes },
      ],
    }).compile();
    service = module.get(ClaimRefundService);
  });

  it('skips duplicate refund when already processed', async () => {
    prisma.orderClaim.findUnique.mockResolvedValue({
      ...baseClaim,
      refund: { status: PaymentStatus.REFUNDED },
    });

    await service.processRefund('claim-2', 'admin', 'ADMIN' as never);
    expect(razorpay.createRefund).not.toHaveBeenCalled();
  });

  it('skips Razorpay when razorpayRefundId already persisted', async () => {
    prisma.orderClaim.findUnique.mockResolvedValue(baseClaim);
    prisma.claimRefund.aggregate.mockResolvedValue({ _sum: { razorpayAmount: 0 } });
    prisma.claimRefund.findUnique.mockResolvedValue({
      id: 'ref-1',
      claimId: 'claim-2',
      status: PaymentStatus.PENDING,
      razorpayRefundId: 'rfnd_existing',
      razorpayAmount: 50,
      walletTxnId: null,
      amount: 50,
    });
    prisma.claimRefund.update.mockResolvedValue({
      id: 'ref-1',
      razorpayRefundId: 'rfnd_existing',
    });
    prisma.paymentTransaction.findFirst.mockResolvedValue({ id: 'pt-1' });

    await service.processRefund('claim-2', 'admin', 'ADMIN' as never);
    expect(razorpay.createRefund).not.toHaveBeenCalled();
    expect(ledger.recordClaimRefund).toHaveBeenCalled();
  });

  it('caps Razorpay refund to remaining order amount', async () => {
    prisma.orderClaim.findUnique.mockResolvedValue({
      ...baseClaim,
      approvedAmount: 40,
      order: {
        ...baseClaim.order,
        razorpayAmount: 100,
      },
    });
    prisma.claimRefund.aggregate.mockResolvedValue({ _sum: { razorpayAmount: 90 } });
    prisma.claimRefund.findUnique.mockResolvedValue(null);
    prisma.claimRefund.create.mockResolvedValue({
      id: 'ref-1',
      razorpayRefundId: null,
      walletTxnId: null,
    });
    prisma.claimRefund.update.mockImplementation(({ data }) => ({
      id: 'ref-1',
      ...data,
    }));
    prisma.paymentTransaction.findFirst.mockResolvedValue(null);

    await service.processRefund('claim-2', 'admin', 'ADMIN' as never);

    expect(razorpay.createRefund).toHaveBeenCalledWith('rzp_pay', 10, expect.any(Object));
  });
});
