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
exports.MerchantLogisticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_service_1 = require("../../database/prisma.service");
const delivery_orchestrator_service_1 = require("./delivery-orchestrator.service");
const logistics_errors_1 = require("./errors/logistics.errors");
let MerchantLogisticsController = class MerchantLogisticsController {
    constructor(prisma, orchestrator) {
        this.prisma = prisma;
        this.orchestrator = orchestrator;
    }
    async getShipment(user, orderId) {
        await this.assertMerchantOrder(user.id, orderId);
        const shipment = await this.prisma.providerShipment.findUnique({
            where: { orderId },
            include: {
                events: { orderBy: { occurredAt: 'desc' }, take: 20 },
                provider: { select: { name: true, type: true } },
            },
        });
        if (!shipment)
            throw new common_1.NotFoundException('No shipment for this order');
        return { success: true, data: shipment };
    }
    async cancelShipment(user, orderId, body) {
        await this.assertMerchantOrder(user.id, orderId);
        await this.orchestrator.cancelShipment(orderId, body.reason);
        return { success: true };
    }
    async retryShipment(user, orderId) {
        await this.assertMerchantOrder(user.id, orderId);
        try {
            const data = await this.orchestrator.retryShipment(orderId);
            return { success: true, data };
        }
        catch (err) {
            if (err instanceof logistics_errors_1.LogisticsProviderError) {
                throw new common_1.BadRequestException({
                    code: 'SHADOWFAX_CREATE_FAILED',
                    providerStatusCode: err.providerStatusCode ?? (err.code ? Number(err.code) || err.code : undefined),
                    providerMessage: err.providerMessage ?? err.message,
                    retryable: err.retryable,
                    message: err.message,
                });
            }
            throw err;
        }
    }
    async assertMerchantOrder(userId, orderId) {
        const stores = await this.prisma.store.findMany({
            where: { merchantProfile: { userId } },
            select: { id: true },
        });
        const storeIds = stores.map((s) => s.id);
        if (storeIds.length === 0)
            throw new common_1.ForbiddenException('No stores');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, storeId: { in: storeIds } },
            select: { id: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
    }
};
exports.MerchantLogisticsController = MerchantLogisticsController;
__decorate([
    (0, common_1.Get)(':orderId/shipment'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider shipment details for an order' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantLogisticsController.prototype, "getShipment", null);
__decorate([
    (0, common_1.Post)(':orderId/shipment/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel provider shipment' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MerchantLogisticsController.prototype, "cancelShipment", null);
__decorate([
    (0, common_1.Post)(':orderId/shipment/retry'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Retry failed shipment creation' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantLogisticsController.prototype, "retryShipment", null);
exports.MerchantLogisticsController = MerchantLogisticsController = __decorate([
    (0, swagger_1.ApiTags)('merchant-logistics'),
    (0, common_1.Controller)('merchant/orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        delivery_orchestrator_service_1.DeliveryOrchestratorService])
], MerchantLogisticsController);
//# sourceMappingURL=merchant-logistics.controller.js.map