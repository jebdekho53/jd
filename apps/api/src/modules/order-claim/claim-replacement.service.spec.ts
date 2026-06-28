import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClaimReplacementService } from './claim-replacement.service';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from '../logistics/delivery-orchestrator.service';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { OrderClaimStatus } from '@prisma/client';
import { REPLACEMENT_DISPATCH_FAILED } from './order-claim.constants';

describe('ClaimReplacementService dispatch failure', () => {
  let service: ClaimReplacementService;

  const prisma = {
    orderClaim: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    order: { create: jest.fn() },
    orderItem: { create: jest.fn() },
    claimReplacement: { create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  } as any;
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));

  const delivery = {
    dispatchShipment: jest.fn().mockRejectedValue(new Error('Shadowfax down')),
  };

  const eligibility = { appendHistory: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimReplacementService,
        { provide: PrismaService, useValue: prisma },
        { provide: DeliveryOrchestratorService, useValue: delivery },
        { provide: ClaimEligibilityService, useValue: eligibility },
      ],
    }).compile();
    service = module.get(ClaimReplacementService);
  });

  it('marks DISPATCH_FAILED and throws when Shadowfax dispatch fails', async () => {
    prisma.orderClaim.findUnique.mockResolvedValue({
      id: 'claim-1',
      claimNumber: 'CLM-1',
      items: [
        {
          quantityClaimed: 1,
          quantityApproved: 1,
          unitPrice: 10,
          orderItem: {
            productId: 'p1',
            variantId: 'v1',
            productName: 'Item',
            variantName: 'Default',
            sku: 'SKU',
          },
        },
      ],
      order: {
        buyerProfileId: 'bp1',
        storeId: 's1',
        deliveryAddress: {},
        deliveryLat: 1,
        deliveryLng: 2,
        orderVertical: 'GROCERY',
      },
      replacement: null,
    });

    prisma.order.create.mockResolvedValue({ id: 'repl-order-1' });
    prisma.claimReplacement.create.mockResolvedValue({ id: 'cr-1' });
    prisma.orderClaim.update.mockResolvedValue({});
    prisma.orderItem.create.mockResolvedValue({});

    await expect(
      service.issueReplacement('claim-1', 'merchant-1', 'MERCHANT' as never, true),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.claimReplacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: REPLACEMENT_DISPATCH_FAILED },
      }),
    );
    expect(eligibility.appendHistory).toHaveBeenCalledWith(
      prisma,
      'claim-1',
      OrderClaimStatus.REPLACEMENT_APPROVED,
      'MERCHANT',
      'merchant-1',
      expect.stringContaining('dispatch failed'),
      expect.any(Object),
    );
  });
});
