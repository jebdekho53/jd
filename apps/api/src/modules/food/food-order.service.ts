import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FoodKitchenStatus,
  OrderActorType,
  OrderStatus,
  OrderVertical,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryDispatchService } from '../logistics/delivery-dispatch.service';
import { merchantPaymentVisibilityWhere } from '../order/merchant-order-visibility.util';

const FOOD_FORWARD: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED_BY_BUYER],
  [OrderStatus.PAID]: [OrderStatus.MERCHANT_ACCEPTED, OrderStatus.CANCELLED_BY_MERCHANT],
  [OrderStatus.MERCHANT_ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED_BY_MERCHANT],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED_BY_MERCHANT],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP],
  [OrderStatus.RIDER_ASSIGNED]: [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
};

const KITCHEN_MAP: Record<FoodKitchenStatus, FoodKitchenStatus[]> = {
  [FoodKitchenStatus.NEW]: [FoodKitchenStatus.PREPARING],
  [FoodKitchenStatus.PREPARING]: [FoodKitchenStatus.READY],
  [FoodKitchenStatus.READY]: [FoodKitchenStatus.COMPLETED],
  [FoodKitchenStatus.COMPLETED]: [],
};

const ACTIVE_KITCHEN_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.MERCHANT_ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];

@Injectable()
export class FoodOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly deliveryDispatch: DeliveryDispatchService,
  ) {}

  async assertMerchantFoodOrder(merchantUserId: string, orderId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId: merchantUserId },
      include: { stores: { select: { id: true } } },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const storeIds = merchant.stores.map((s) => s.id);
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        storeId: { in: storeIds },
        orderVertical: OrderVertical.FOOD,
        ...merchantPaymentVisibilityWhere(),
      },
      include: { foodItems: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Food order not found');
    return order;
  }

  async transitionFoodOrder(
    merchantUserId: string,
    orderId: string,
    toStatus: OrderStatus,
  ) {
    const order = await this.assertMerchantFoodOrder(merchantUserId, orderId);
    const allowed = FOOD_FORWARD[order.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${toStatus}`);
    }

    const kitchenStatus = this.kitchenStatusForOrderStatus(toStatus);
    const alreadyReady = order.status === OrderStatus.READY_FOR_PICKUP;

    await this.statusHistory.transition({
      orderId,
      toStatus,
      actorType: OrderActorType.MERCHANT,
      actorId: merchantUserId,
    });

    if (kitchenStatus) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { kitchenStatus },
      });
    }

    if (toStatus === OrderStatus.READY_FOR_PICKUP && !alreadyReady) {
      void this.deliveryDispatch.dispatchAfterReadyForPickup(orderId);
    }

    return this.assertMerchantFoodOrder(merchantUserId, orderId);
  }

  async updateKitchenStatus(merchantUserId: string, orderId: string, status: FoodKitchenStatus) {
    const order = await this.assertMerchantFoodOrder(merchantUserId, orderId);

    if (
      status === FoodKitchenStatus.READY &&
      order.status === OrderStatus.READY_FOR_PICKUP &&
      order.kitchenStatus === FoodKitchenStatus.READY
    ) {
      return order;
    }

    const currentKitchen = order.kitchenStatus ?? FoodKitchenStatus.NEW;
    const allowed = KITCHEN_MAP[currentKitchen] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Invalid kitchen transition to ${status}`);
    }

    if (status === FoodKitchenStatus.PREPARING) {
      if (order.status === OrderStatus.PAID) {
        await this.transitionFoodOrder(merchantUserId, orderId, OrderStatus.MERCHANT_ACCEPTED);
      }
      return this.transitionFoodOrder(merchantUserId, orderId, OrderStatus.PREPARING);
    }

    if (status === FoodKitchenStatus.READY) {
      if (order.status !== OrderStatus.READY_FOR_PICKUP) {
        return this.transitionFoodOrder(merchantUserId, orderId, OrderStatus.READY_FOR_PICKUP);
      }
      return this.assertMerchantFoodOrder(merchantUserId, orderId);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { kitchenStatus: status },
    });

    return this.assertMerchantFoodOrder(merchantUserId, orderId);
  }

  async getKitchenQueue(merchantUserId: string, storeId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({ where: { userId: merchantUserId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: merchant.id },
    });
    if (!store) throw new NotFoundException('Store not found');

    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        orderVertical: OrderVertical.FOOD,
        status: { in: ACTIVE_KITCHEN_STATUSES },
        AND: [merchantPaymentVisibilityWhere()],
      },
      include: { foodItems: true },
      orderBy: { createdAt: 'asc' },
    });

    const normalized = orders.map((o) => ({
      ...o,
      kitchenStatus: o.kitchenStatus ?? FoodKitchenStatus.NEW,
    }));

    return {
      new: normalized.filter(
        (o) =>
          o.kitchenStatus === FoodKitchenStatus.NEW &&
          (o.status === OrderStatus.PAID ||
            o.status === OrderStatus.MERCHANT_ACCEPTED),
      ),
      preparing: normalized.filter(
        (o) =>
          o.kitchenStatus === FoodKitchenStatus.PREPARING ||
          o.status === OrderStatus.PREPARING,
      ),
      ready: normalized.filter(
        (o) =>
          o.kitchenStatus === FoodKitchenStatus.READY ||
          o.status === OrderStatus.READY_FOR_PICKUP,
      ),
      completed: await this.prisma.order.count({
        where: {
          storeId,
          orderVertical: OrderVertical.FOOD,
          kitchenStatus: FoodKitchenStatus.COMPLETED,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    };
  }

  async getRestaurantDashboard(merchantUserId: string, storeId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfile: { userId: merchantUserId } },
    });
    if (!store) throw new NotFoundException('Store not found');

    const [todayOrders, cancelled, revenue, popularDishes, queue] = await Promise.all([
      this.prisma.order.count({
        where: { storeId, orderVertical: OrderVertical.FOOD, createdAt: { gte: startOfDay } },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          orderVertical: OrderVertical.FOOD,
          status: { in: [OrderStatus.CANCELLED_BY_BUYER, OrderStatus.CANCELLED_BY_MERCHANT] },
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          storeId,
          orderVertical: OrderVertical.FOOD,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
          createdAt: { gte: startOfDay },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.foodOrderItem.groupBy({
        by: ['itemName'],
        where: { order: { storeId, orderVertical: OrderVertical.FOOD, createdAt: { gte: startOfDay } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.getKitchenQueue(merchantUserId, storeId),
    ]);

    const profile = await this.prisma.restaurantProfile.findUnique({ where: { storeId } });

    return {
      todayOrders,
      cancelledOrders: cancelled,
      revenue: Number(revenue._sum.totalAmount ?? 0),
      acceptanceRate: profile?.acceptanceRate ?? 100,
      avgPrepTimeMins: profile?.avgPrepTimeMins ?? store.avgPrepTimeMins,
      popularDishes: popularDishes.map((d) => ({
        name: d.itemName,
        quantity: d._sum.quantity ?? 0,
      })),
      kitchenQueue: queue,
    };
  }

  private kitchenStatusForOrderStatus(status: OrderStatus): FoodKitchenStatus | null {
    switch (status) {
      case OrderStatus.MERCHANT_ACCEPTED:
        return FoodKitchenStatus.NEW;
      case OrderStatus.PREPARING:
        return FoodKitchenStatus.PREPARING;
      case OrderStatus.READY_FOR_PICKUP:
        return FoodKitchenStatus.READY;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return FoodKitchenStatus.COMPLETED;
      default:
        return null;
    }
  }
}
