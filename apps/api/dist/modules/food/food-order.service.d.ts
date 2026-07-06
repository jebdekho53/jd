import { FoodKitchenStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryDispatchService } from '../logistics/delivery-dispatch.service';
export declare class FoodOrderService {
    private readonly prisma;
    private readonly statusHistory;
    private readonly deliveryDispatch;
    constructor(prisma: PrismaService, statusHistory: OrderStatusHistoryService, deliveryDispatch: DeliveryDispatchService);
    assertMerchantFoodOrder(merchantUserId: string, orderId: string): Promise<any>;
    transitionFoodOrder(merchantUserId: string, orderId: string, toStatus: OrderStatus): Promise<any>;
    updateKitchenStatus(merchantUserId: string, orderId: string, status: FoodKitchenStatus): Promise<any>;
    getKitchenQueue(merchantUserId: string, storeId: string): Promise<{
        new: any;
        preparing: any;
        ready: any;
        completed: any;
    }>;
    getRestaurantDashboard(merchantUserId: string, storeId: string): Promise<{
        todayOrders: any;
        cancelledOrders: any;
        revenue: number;
        acceptanceRate: any;
        avgPrepTimeMins: any;
        popularDishes: any;
        kitchenQueue: any;
    }>;
    private kitchenStatusForOrderStatus;
}
