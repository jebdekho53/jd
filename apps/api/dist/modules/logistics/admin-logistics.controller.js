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
exports.AdminLogisticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const delivery_orchestrator_service_1 = require("./delivery-orchestrator.service");
const logistics_provider_registry_1 = require("./logistics-provider.registry");
const prisma_service_1 = require("../../database/prisma.service");
const common_2 = require("@nestjs/common");
let AdminLogisticsController = class AdminLogisticsController {
    constructor(orchestrator, registry, prisma) {
        this.orchestrator = orchestrator;
        this.registry = registry;
        this.prisma = prisma;
    }
    async dashboard() {
        const stats = await this.orchestrator.getDashboardStats();
        return {
            success: true,
            data: {
                ...stats,
                registeredProviders: this.registry.listRegistered(),
            },
        };
    }
    async healthCheck() {
        const provider = this.registry.getPrimary();
        const result = await provider.healthCheck();
        return { success: true, data: { provider: provider.type, ...result } };
    }
    async recentWebhooks() {
        const events = await this.prisma.providerWebhook.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                providerType: true,
                eventId: true,
                status: true,
                errorMessage: true,
                createdAt: true,
                processedAt: true,
            },
        });
        return { success: true, data: events };
    }
    async retryShipment(shipmentId) {
        const shipment = await this.prisma.providerShipment.findUnique({
            where: { id: shipmentId },
            select: { orderId: true, externalShipmentId: true },
        });
        if (!shipment)
            throw new common_2.NotFoundException('Shipment not found');
        if (shipment.externalShipmentId) {
            return { success: false, message: 'Shipment already created with provider' };
        }
        const data = await this.orchestrator.retryShipment(shipment.orderId);
        return { success: true, data };
    }
};
exports.AdminLogisticsController = AdminLogisticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Logistics operations dashboard' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminLogisticsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Post)('health-check'),
    (0, swagger_1.ApiOperation)({ summary: 'Run health check on active provider' }),
    openapi.ApiResponse({ status: 201 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminLogisticsController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Get)('webhooks/recent'),
    (0, swagger_1.ApiOperation)({ summary: 'Recent provider webhook events' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminLogisticsController.prototype, "recentWebhooks", null);
__decorate([
    (0, common_1.Post)('shipments/:shipmentId/retry'),
    (0, swagger_1.ApiOperation)({ summary: 'Retry failed shipment creation by provider shipment id' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('shipmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminLogisticsController.prototype, "retryShipment", null);
exports.AdminLogisticsController = AdminLogisticsController = __decorate([
    (0, swagger_1.ApiTags)('admin-logistics'),
    (0, common_1.Controller)('admin/logistics'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __metadata("design:paramtypes", [delivery_orchestrator_service_1.DeliveryOrchestratorService,
        logistics_provider_registry_1.LogisticsProviderRegistry,
        prisma_service_1.PrismaService])
], AdminLogisticsController);
//# sourceMappingURL=admin-logistics.controller.js.map