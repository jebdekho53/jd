import { Test, TestingModule } from '@nestjs/testing';
import { FoodOrderService } from './food-order.service';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryDispatchService } from '../logistics/delivery-dispatch.service';
import { FoodKitchenStatus, OrderStatus, OrderVertical } from '@prisma/client';

describe('FoodOrderService', () => {
  let service: FoodOrderService;
  const prisma = {
    merchantProfile: { findUnique: jest.fn() },
    order: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    store: { findFirst: jest.fn() },
    foodOrderItem: { groupBy: jest.fn() },
    restaurantProfile: { findUnique: jest.fn() },
  };
  const statusHistory = { transition: jest.fn() };
  const dispatch = { dispatchAfterReadyForPickup: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodOrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderStatusHistoryService, useValue: statusHistory },
        { provide: DeliveryDispatchService, useValue: dispatch },
      ],
    }).compile();
    service = module.get(FoodOrderService);
    jest.clearAllMocks();
  });

  it('updates kitchen status from NEW to PREPARING', async () => {
    const baseOrder = {
      id: 'o1',
      storeId: 's1',
      orderVertical: OrderVertical.FOOD,
      foodItems: [],
      statusHistory: [],
    };
    prisma.merchantProfile.findUnique.mockResolvedValue({
      id: 'mp1',
      stores: [{ id: 's1' }],
    });
    prisma.order.findFirst.mockImplementation(() =>
      Promise.resolve({
        ...baseOrder,
        status: OrderStatus.MERCHANT_ACCEPTED,
        kitchenStatus: FoodKitchenStatus.NEW,
      }),
    );
    prisma.order.update.mockResolvedValue({});

    await service.updateKitchenStatus('merchant-user', 'o1', FoodKitchenStatus.PREPARING);
    expect(statusHistory.transition).toHaveBeenCalledWith(
      expect.objectContaining({ toStatus: OrderStatus.PREPARING }),
    );
  });

  it('dispatches Shadowfax only once when marking ready twice', async () => {
    prisma.merchantProfile.findUnique.mockResolvedValue({
      id: 'mp1',
      stores: [{ id: 's1' }],
    });
    prisma.order.findFirst.mockResolvedValue({
      id: 'o1',
      storeId: 's1',
      status: OrderStatus.READY_FOR_PICKUP,
      kitchenStatus: FoodKitchenStatus.READY,
      orderVertical: OrderVertical.FOOD,
      foodItems: [],
      statusHistory: [],
    });

    await service.updateKitchenStatus('merchant-user', 'o1', FoodKitchenStatus.READY);
    expect(dispatch.dispatchAfterReadyForPickup).not.toHaveBeenCalled();
  });

  it('kitchen queue includes paid online orders awaiting prep', async () => {
    prisma.merchantProfile.findUnique.mockResolvedValue({ id: 'mp1' });
    prisma.store.findFirst.mockResolvedValue({ id: 's1' });
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'o-paid',
        status: OrderStatus.PAID,
        kitchenStatus: null,
        foodItems: [],
      },
    ]);
    prisma.order.count.mockResolvedValue(0);

    const queue = await service.getKitchenQueue('merchant-user', 's1');
    expect(queue.new).toHaveLength(1);
  });
});
