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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRestaurantController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const vertical_service_1 = require("./vertical.service");
const restaurant_discovery_service_1 = require("./restaurant-discovery.service");
const prisma_service_1 = require("../../database/prisma.service");
const client_2 = require("@prisma/client");
let AdminRestaurantController = class AdminRestaurantController {
    constructor(vertical, discovery, prisma) {
        this.vertical = vertical;
        this.discovery = discovery;
        this.prisma = prisma;
    }
    async pendingApprovals(page) {
        const data = await this.prisma.storeBusinessType.findMany({
            where: {
                businessType: { in: ['RESTAURANT', 'CLOUD_KITCHEN', 'CAFE'] },
                status: 'PENDING',
            },
            include: { store: { select: { id: true, name: true, slug: true, status: true } } },
            take: 20,
            skip: ((page ?? 1) - 1) * 20,
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data };
    }
    async approveType(user, storeId, businessType) {
        const data = await this.vertical.approveStoreBusinessType(storeId, businessType, user.id);
        return { success: true, data };
    }
    async rejectType(user, storeId, businessType, reason) {
        const data = await this.vertical.rejectStoreBusinessType(storeId, businessType, user.id, reason);
        return { success: true, data };
    }
    async listCuisines() {
        const data = await this.discovery.listCuisines();
        return { success: true, data };
    }
    async foodOrderAnalytics(days) {
        const since = new Date();
        since.setDate(since.getDate() - (days ?? 7));
        const [total, revenue, byStatus] = await Promise.all([
            this.prisma.order.count({
                where: { orderVertical: client_2.OrderVertical.FOOD, createdAt: { gte: since } },
            }),
            this.prisma.order.aggregate({
                where: {
                    orderVertical: client_2.OrderVertical.FOOD,
                    status: { in: ['DELIVERED', 'COMPLETED'] },
                    createdAt: { gte: since },
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.groupBy({
                by: ['status'],
                where: { orderVertical: client_2.OrderVertical.FOOD, createdAt: { gte: since } },
                _count: true,
            }),
        ]);
        return {
            success: true,
            data: {
                totalOrders: total,
                revenue: Number(revenue._sum.totalAmount ?? 0),
                byStatus,
            },
        };
    }
    async popularDishes(limit) {
        const data = await this.prisma.foodOrderItem.groupBy({
            by: ['itemName'],
            where: { order: { orderVertical: client_2.OrderVertical.FOOD } },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit ? Number(limit) : 20,
        });
        return { success: true, data };
    }
    async pendingFoodCheckouts(page) {
        const take = 20;
        const skip = ((page ?? 1) - 1) * take;
        const [data, total] = await Promise.all([
            this.prisma.foodCheckout.findMany({
                where: { status: 'PENDING', paymentMethod: 'RAZORPAY' },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
                include: {
                    buyerProfile: { select: { id: true, name: true, user: { select: { phone: true } } } },
                },
            }),
            this.prisma.foodCheckout.count({
                where: { status: 'PENDING', paymentMethod: 'RAZORPAY' },
            }),
        ]);
        return { success: true, data: { items: data, total, page: page ?? 1 } };
    }
    async foodOrdersOverview() {
        const [pendingPayment, paidAwaitingKitchen, codActive, failed, readyForPickup, withShipment,] = await Promise.all([
            this.prisma.foodCheckout.count({
                where: { status: 'PENDING', paymentMethod: 'RAZORPAY' },
            }),
            this.prisma.order.count({
                where: { orderVertical: client_2.OrderVertical.FOOD, status: 'PAID' },
            }),
            this.prisma.order.count({
                where: {
                    orderVertical: client_2.OrderVertical.FOOD,
                    paymentMethod: 'COD',
                    status: { in: ['MERCHANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'] },
                },
            }),
            this.prisma.order.count({
                where: {
                    orderVertical: client_2.OrderVertical.FOOD,
                    status: { in: ['PAYMENT_FAILED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT'] },
                },
            }),
            this.prisma.order.count({
                where: { orderVertical: client_2.OrderVertical.FOOD, status: 'READY_FOR_PICKUP' },
            }),
            this.prisma.providerShipment.count({
                where: { order: { orderVertical: client_2.OrderVertical.FOOD } },
            }),
        ]);
        return {
            success: true,
            data: {
                pendingOnlineCheckouts: pendingPayment,
                paidAwaitingKitchen,
                codActive,
                failedOrCancelled: failed,
                readyForPickup,
                shadowfaxShipments: withShipment,
            },
        };
    }
};
exports.AdminRestaurantController = AdminRestaurantController;
__decorate([
    (0, common_1.Get)('approvals'),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Stores pending restaurant business type approval' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "pendingApprovals", null);
__decorate([
    (0, common_1.Post)('approvals/:storeId/:businessType/approve'),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('businessType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_a = typeof client_1.VerticalBusinessType !== "undefined" && client_1.VerticalBusinessType) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "approveType", null);
__decorate([
    (0, common_1.Post)('approvals/:storeId/:businessType/reject'),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('businessType')),
    __param(3, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, typeof (_b = typeof client_1.VerticalBusinessType !== "undefined" && client_1.VerticalBusinessType) === "function" ? _b : Object, String]),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "rejectType", null);
__decorate([
    (0, common_1.Get)('cuisines'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "listCuisines", null);
__decorate([
    (0, common_1.Get)('analytics/food-orders'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "foodOrderAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/popular-dishes'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "popularDishes", null);
__decorate([
    (0, common_1.Get)('checkouts/pending-payment'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Food checkouts awaiting Razorpay completion (admin only)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "pendingFoodCheckouts", null);
__decorate([
    (0, common_1.Get)('orders/overview'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Food order + shipment status overview for admin ops' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRestaurantController.prototype, "foodOrdersOverview", null);
exports.AdminRestaurantController = AdminRestaurantController = __decorate([
    (0, swagger_1.ApiTags)('admin / restaurant'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/restaurant-ops'),
    __metadata("design:paramtypes", [vertical_service_1.VerticalService,
        restaurant_discovery_service_1.RestaurantDiscoveryService,
        prisma_service_1.PrismaService])
], AdminRestaurantController);
//# sourceMappingURL=admin-restaurant.controller.js.map