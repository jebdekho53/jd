import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FoodCartService } from './food-cart.service';
import { PrismaService } from '../../database/prisma.service';
import { MenuItemAvailability, StoreStatus } from '@prisma/client';

describe('FoodCartService', () => {
  let service: FoodCartService;
  const prisma = {
    buyerProfile: { findUnique: jest.fn() },
    restaurantMenuItem: { findFirst: jest.fn() },
    foodCart: { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    foodCartItem: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodCartService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(FoodCartService);
    jest.clearAllMocks();
  });

  it('returns null when no food cart exists', async () => {
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.foodCart.findFirst.mockResolvedValue(null);
    const result = await service.getFoodCart('user1');
    expect(result).toBeNull();
  });

  it('throws conflict when adding item from different restaurant', async () => {
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.restaurantMenuItem.findFirst.mockResolvedValue({
      id: 'mi1',
      storeId: 'store-b',
      basePrice: 199,
      variants: [],
      addonGroups: [],
      store: { id: 'store-b', status: StoreStatus.APPROVED, isActive: true },
    });
    prisma.foodCart.findFirst.mockResolvedValue({ id: 'fc1', storeId: 'store-a' });

    await expect(
      service.addItem('user1', { menuItemId: 'mi1', quantity: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects unavailable menu items', async () => {
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.restaurantMenuItem.findFirst.mockResolvedValue(null);

    await expect(
      service.addItem('user1', { menuItemId: 'missing', quantity: 1 }),
    ).rejects.toThrow(NotFoundException);
  });
});
