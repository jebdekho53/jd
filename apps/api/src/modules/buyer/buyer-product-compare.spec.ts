import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BuyerProductService } from './buyer-product.service';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from './buyer-cache.service';
import { ConfigService } from '@nestjs/config';

describe('BuyerProductService compare guard', () => {
  let service: BuyerProductService;
  const prisma = {
    restaurantMenuItem: { findUnique: jest.fn() },
    storeBusinessType: { findMany: jest.fn() },
    product: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerProductService,
        { provide: PrismaService, useValue: prisma },
        { provide: BuyerCacheService, useValue: { wrap: (_k: string, fn: () => unknown) => fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(BuyerProductService);
    jest.clearAllMocks();
  });

  it('rejects menu item ids for compare', async () => {
    prisma.restaurantMenuItem.findUnique.mockResolvedValue({ id: 'menu-1' });

    await expect(service.compareProduct('menu-1', {})).rejects.toThrow(BadRequestException);
  });
});
