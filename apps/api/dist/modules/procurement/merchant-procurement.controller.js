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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantProcurementController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const purchase_recommendation_service_1 = require("./purchase-recommendation.service");
const procurement_marketplace_service_1 = require("./procurement-marketplace.service");
const procurement_cart_service_1 = require("./procurement-cart.service");
const procurement_order_service_1 = require("./procurement-order.service");
const procurement_analytics_service_1 = require("./procurement-analytics.service");
const procurement_dto_1 = require("./dto/procurement.dto");
const prisma_service_1 = require("../../database/prisma.service");
let MerchantProcurementController = class MerchantProcurementController {
    constructor(recommendations, marketplace, cart, orders, analytics, prisma) {
        this.recommendations = recommendations;
        this.marketplace = marketplace;
        this.cart = cart;
        this.orders = orders;
        this.analytics = analytics;
        this.prisma = prisma;
    }
    async merchantId(userId) {
        const p = await this.prisma.merchantProfile.findUnique({ where: { userId }, select: { id: true } });
        return p?.id;
    }
    async getRecommendations(user, query) {
        const id = await this.merchantId(user.id);
        return { success: true, data: id ? await this.recommendations.listRecommendations(id, query.storeId) : [] };
    }
    async vendors(query) {
        return { success: true, data: await this.marketplace.searchVendors(query) };
    }
    async products(query) {
        return { success: true, data: await this.marketplace.searchProducts(query) };
    }
    async credit(user) {
        const id = await this.merchantId(user.id);
        return { success: true, data: id ? await this.marketplace.getCreditLines(id) : [] };
    }
    async getCart(user, query) {
        return { success: true, data: await this.cart.getCart(user.id, query.storeId) };
    }
    async updateCart(user, dto) {
        return { success: true, data: await this.cart.updateCart(user.id, dto) };
    }
    async addCartItem(user, dto, query) {
        return { success: true, data: await this.cart.addItem(user.id, dto, query.storeId) };
    }
    async createOrder(user, dto) {
        return { success: true, data: await this.orders.createOrder(user.id, dto) };
    }
    async listOrders(user, query) {
        return { success: true, data: await this.orders.listOrders(user.id, query.storeId) };
    }
    async getAnalytics(user, query) {
        const id = await this.merchantId(user.id);
        return { success: true, data: id ? await this.analytics.getMerchantAnalytics(id, query.storeId) : {} };
    }
};
exports.MerchantProcurementController = MerchantProcurementController;
__decorate([
    (0, common_1.Get)('recommendations'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('vendors'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "vendors", null);
__decorate([
    (0, common_1.Get)('products'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "products", null);
__decorate([
    (0, common_1.Get)('credit'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "credit", null);
__decorate([
    (0, common_1.Get)('cart'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "getCart", null);
__decorate([
    (0, common_1.Post)('cart'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.UpdateCartDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "updateCart", null);
__decorate([
    (0, common_1.Post)('cart/items'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.AddCartItemDto,
        procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "addCartItem", null);
__decorate([
    (0, common_1.Post)('orders'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.CreateVendorOrderDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('analytics'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.ProcurementQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantProcurementController.prototype, "getAnalytics", null);
exports.MerchantProcurementController = MerchantProcurementController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/procurement'),
    __metadata("design:paramtypes", [purchase_recommendation_service_1.PurchaseRecommendationService,
        procurement_marketplace_service_1.ProcurementMarketplaceService,
        procurement_cart_service_1.ProcurementCartService,
        procurement_order_service_1.ProcurementOrderService,
        procurement_analytics_service_1.ProcurementAnalyticsService,
        prisma_service_1.PrismaService])
], MerchantProcurementController);
//# sourceMappingURL=merchant-procurement.controller.js.map