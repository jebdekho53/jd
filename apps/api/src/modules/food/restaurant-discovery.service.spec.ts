import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { PrismaService } from '../../database/prisma.service';
import { VerticalBusinessType } from '@prisma/client';
import { BUYER_HOME_VERTICALS, isFoodVertical } from './vertical.constants';

describe('RestaurantDiscoveryService', () => {
  let service: RestaurantDiscoveryService;
  const prisma = {
    store: { findFirst: jest.fn(), findMany: jest.fn() },
    cuisine: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantDiscoveryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RestaurantDiscoveryService);
    jest.clearAllMocks();
  });

  it('exposes buyer home vertical navigation', () => {
    const verticals = service.getHomeVerticals();
    expect(verticals).toEqual(BUYER_HOME_VERTICALS);
    expect(verticals.some((v) => v.label === 'Food')).toBe(true);
  });

  it('lists cuisines for SEO pages', async () => {
    prisma.cuisine.findMany.mockResolvedValue([{ id: '1', name: 'Biryani', slug: 'biryani' }]);
    const result = await service.listCuisines();
    expect(result).toHaveLength(1);
  });
});

describe('compare vertical guard', () => {
  it('compare is grocery-only — food verticals are not product catalog', () => {
    expect(isFoodVertical(VerticalBusinessType.RESTAURANT)).toBe(true);
    expect(isFoodVertical(VerticalBusinessType.GROCERY)).toBe(false);
  });
});
