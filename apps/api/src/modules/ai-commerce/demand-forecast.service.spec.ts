import { Test, TestingModule } from '@nestjs/testing';
import { DemandForecastService } from './demand-forecast.service';
import { PrismaService } from '../../database/prisma.service';
import { predictDemand } from './demand-forecast.util';

describe('DemandForecastService', () => {
  let service: DemandForecastService;
  const mockPrisma = {
    product: { findMany: jest.fn() },
    orderItem: { aggregate: jest.fn() },
    searchEvent: { count: jest.fn() },
    cartItem: { count: jest.fn() },
    storePromotion: { count: jest.fn() },
    demandForecast: { upsert: jest.fn() },
    store: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemandForecastService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(DemandForecastService);
    jest.clearAllMocks();
  });

  it('predicts higher demand with strong signals', () => {
    const result = predictDemand(
      { orderQty7d: 70, orderQty30d: 200, searchHits7d: 100, cartAdds7d: 50, campaignBoost: 0.1 },
      7,
    );
    expect(result.predictedDemand).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThan(50);
  });

  it('runs forecasts for store products', async () => {
    mockPrisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
    mockPrisma.orderItem.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });
    mockPrisma.searchEvent.count.mockResolvedValue(5);
    mockPrisma.cartItem.count.mockResolvedValue(3);
    mockPrisma.storePromotion.count.mockResolvedValue(1);
    mockPrisma.demandForecast.upsert.mockResolvedValue({});

    const count = await service.runForecastsForStore('store-1');
    expect(count).toBe(2);
    expect(mockPrisma.demandForecast.upsert).toHaveBeenCalled();
  });
});
