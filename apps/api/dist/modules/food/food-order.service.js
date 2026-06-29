"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodOrderService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const delivery_dispatch_service_1 = require("../logistics/delivery-dispatch.service");
const merchant_order_visibility_util_1 = require("../order/merchant-order-visibility.util");
const FOOD_FORWARD = {
    [client_1.OrderStatus.PAYMENT_PENDING]: [client_1.OrderStatus.PAID, client_1.OrderStatus.PAYMENT_FAILED, client_1.OrderStatus.CANCELLED_BY_BUYER],
    [client_1.OrderStatus.PAID]: [client_1.OrderStatus.MERCHANT_ACCEPTED, client_1.OrderStatus.CANCELLED_BY_MERCHANT],
    [client_1.OrderStatus.MERCHANT_ACCEPTED]: [client_1.OrderStatus.PREPARING, client_1.OrderStatus.CANCELLED_BY_MERCHANT],
    [client_1.OrderStatus.PREPARING]: [client_1.OrderStatus.READY_FOR_PICKUP, client_1.OrderStatus.CANCELLED_BY_MERCHANT],
    [client_1.OrderStatus.READY_FOR_PICKUP]: [client_1.OrderStatus.RIDER_ASSIGNED, client_1.OrderStatus.PICKED_UP],
    [client_1.OrderStatus.RIDER_ASSIGNED]: [client_1.OrderStatus.PICKED_UP],
    [client_1.OrderStatus.PICKED_UP]: [client_1.OrderStatus.OUT_FOR_DELIVERY],
    [client_1.OrderStatus.OUT_FOR_DELIVERY]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.DELIVERY_FAILED],
    [client_1.OrderStatus.DELIVERED]: [client_1.OrderStatus.COMPLETED],
};
const KITCHEN_MAP = {
    [client_1.FoodKitchenStatus.NEW]: [client_1.FoodKitchenStatus.PREPARING],
    [client_1.FoodKitchenStatus.PREPARING]: [client_1.FoodKitchenStatus.READY],
    [client_1.FoodKitchenStatus.READY]: [client_1.FoodKitchenStatus.COMPLETED],
    [client_1.FoodKitchenStatus.COMPLETED]: [],
};
const ACTIVE_KITCHEN_STATUSES = [
    client_1.OrderStatus.PAID,
    client_1.OrderStatus.MERCHANT_ACCEPTED,
    client_1.OrderStatus.PREPARING,
    client_1.OrderStatus.READY_FOR_PICKUP,
];
let FoodOrderService = class FoodOrderService {
    constructor(prisma, statusHistory, deliveryDispatch) {
        this.prisma = prisma;
        this.statusHistory = statusHistory;
        this.deliveryDispatch = deliveryDispatch;
    }
    async assertMerchantFoodOrder(merchantUserId, orderId) {
        const merchant = await this.prisma.merchantProfile.findUnique({
            where: { userId: merchantUserId },
            include: { stores: { select: { id: true } } },
        });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        const storeIds = merchant.stores.map((s) => s.id);
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                storeId: { in: storeIds },
                orderVertical: client_1.OrderVertical.FOOD,
                ...(0, merchant_order_visibility_util_1.merchantPaymentVisibilityWhere)(),
            },
            include: { foodItems: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Food order not found');
        return order;
    }
    async transitionFoodOrder(merchantUserId, orderId, toStatus) {
        const order = await this.assertMerchantFoodOrder(merchantUserId, orderId);
        const allowed = FOOD_FORWARD[order.status] ?? [];
        if (!allowed.includes(toStatus)) {
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${toStatus}`);
        }
        const kitchenStatus = this.kitchenStatusForOrderStatus(toStatus);
        const alreadyReady = order.status === client_1.OrderStatus.READY_FOR_PICKUP;
        await this.statusHistory.transition({
            orderId,
            toStatus,
            actorType: client_1.OrderActorType.MERCHANT,
            actorId: merchantUserId,
        });
        if (kitchenStatus) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { kitchenStatus },
            });
        }
        if (toStatus === client_1.OrderStatus.READY_FOR_PICKUP && !alreadyReady) {
            void this.deliveryDispatch.dispatchAfterReadyForPickup(orderId);
        }
        return this.assertMerchantFoodOrder(merchantUserId, orderId);
    }
    async updateKitchenStatus(merchantUserId, orderId, status) {
        const order = await this.assertMerchantFoodOrder(merchantUserId, orderId);
        if (status === client_1.FoodKitchenStatus.READY &&
            order.status === client_1.OrderStatus.READY_FOR_PICKUP &&
            order.kitchenStatus === client_1.FoodKitchenStatus.READY) {
            return order;
        }
        const currentKitchen = order.kitchenStatus ?? client_1.FoodKitchenStatus.NEW;
        const allowed = KITCHEN_MAP[currentKitchen] ?? [];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException(`Invalid kitchen transition to ${status}`);
        }
        if (status === client_1.FoodKitchenStatus.PREPARING) {
            if (order.status === client_1.OrderStatus.PAID) {
                await this.transitionFoodOrder(merchantUserId, orderId, client_1.OrderStatus.MERCHANT_ACCEPTED);
            }
            return this.transitionFoodOrder(merchantUserId, orderId, client_1.OrderStatus.PREPARING);
        }
        if (status === client_1.FoodKitchenStatus.READY) {
            if (order.status !== client_1.OrderStatus.READY_FOR_PICKUP) {
                return this.transitionFoodOrder(merchantUserId, orderId, client_1.OrderStatus.READY_FOR_PICKUP);
            }
            return this.assertMerchantFoodOrder(merchantUserId, orderId);
        }
        await this.prisma.order.update({
            where: { id: orderId },
            data: { kitchenStatus: status },
        });
        return this.assertMerchantFoodOrder(merchantUserId, orderId);
    }
    async getKitchenQueue(merchantUserId, storeId) {
        const merchant = await this.prisma.merchantProfile.findUnique({ where: { userId: merchantUserId } });
        if (!merchant)
            throw new common_1.NotFoundException('Merchant not found');
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: merchant.id },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        const orders = await this.prisma.order.findMany({
            where: {
                storeId,
                orderVertical: client_1.OrderVertical.FOOD,
                status: { in: ACTIVE_KITCHEN_STATUSES },
                AND: [(0, merchant_order_visibility_util_1.merchantPaymentVisibilityWhere)()],
            },
            include: { foodItems: true },
            orderBy: { createdAt: 'asc' },
        });
        const normalized = orders.map((o) => ({
            ...o,
            kitchenStatus: o.kitchenStatus ?? client_1.FoodKitchenStatus.NEW,
        }));
        return {
            new: normalized.filter((o) => o.kitchenStatus === client_1.FoodKitchenStatus.NEW &&
                (o.status === client_1.OrderStatus.PAID ||
                    o.status === client_1.OrderStatus.MERCHANT_ACCEPTED)),
            preparing: normalized.filter((o) => o.kitchenStatus === client_1.FoodKitchenStatus.PREPARING ||
                o.status === client_1.OrderStatus.PREPARING),
            ready: normalized.filter((o) => o.kitchenStatus === client_1.FoodKitchenStatus.READY ||
                o.status === client_1.OrderStatus.READY_FOR_PICKUP),
            completed: await this.prisma.order.count({
                where: {
                    storeId,
                    orderVertical: client_1.OrderVertical.FOOD,
                    kitchenStatus: client_1.FoodKitchenStatus.COMPLETED,
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
        };
    }
    async getRestaurantDashboard(merchantUserId, storeId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfile: { userId: merchantUserId } },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        const [todayOrders, cancelled, revenue, popularDishes, queue] = await Promise.all([
            this.prisma.order.count({
                where: { storeId, orderVertical: client_1.OrderVertical.FOOD, createdAt: { gte: startOfDay } },
            }),
            this.prisma.order.count({
                where: {
                    storeId,
                    orderVertical: client_1.OrderVertical.FOOD,
                    status: { in: [client_1.OrderStatus.CANCELLED_BY_BUYER, client_1.OrderStatus.CANCELLED_BY_MERCHANT] },
                    createdAt: { gte: startOfDay },
                },
            }),
            this.prisma.order.aggregate({
                where: {
                    storeId,
                    orderVertical: client_1.OrderVertical.FOOD,
                    status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
                    createdAt: { gte: startOfDay },
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.foodOrderItem.groupBy({
                by: ['itemName'],
                where: { order: { storeId, orderVertical: client_1.OrderVertical.FOOD, createdAt: { gte: startOfDay } } },
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
    kitchenStatusForOrderStatus(status) {
        switch (status) {
            case client_1.OrderStatus.MERCHANT_ACCEPTED:
                return client_1.FoodKitchenStatus.NEW;
            case client_1.OrderStatus.PREPARING:
                return client_1.FoodKitchenStatus.PREPARING;
            case client_1.OrderStatus.READY_FOR_PICKUP:
                return client_1.FoodKitchenStatus.READY;
            case client_1.OrderStatus.DELIVERED:
            case client_1.OrderStatus.COMPLETED:
                return client_1.FoodKitchenStatus.COMPLETED;
            default:
                return null;
        }
    }
};
exports.FoodOrderService = FoodOrderService;
exports.FoodOrderService = FoodOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        order_status_history_service_1.OrderStatusHistoryService,
        delivery_dispatch_service_1.DeliveryDispatchService])
], FoodOrderService);
//# sourceMappingURL=food-order.service.js.map