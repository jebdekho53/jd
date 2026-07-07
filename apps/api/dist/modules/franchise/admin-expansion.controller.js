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
exports.AdminFranchiseAnalyticsController = exports.AdminExpansionController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const franchise_service_1 = require("./franchise.service");
const territory_service_1 = require("./territory.service");
const expansion_service_1 = require("./expansion.service");
const franchise_analytics_service_1 = require("./franchise-analytics.service");
const franchise_settlement_service_1 = require("./franchise-settlement.service");
const franchise_dto_1 = require("./dto/franchise.dto");
let AdminExpansionController = class AdminExpansionController {
    constructor(franchise, territory, expansion, analytics, settlements) {
        this.franchise = franchise;
        this.territory = territory;
        this.expansion = expansion;
        this.analytics = analytics;
        this.settlements = settlements;
    }
    async overview() {
        const [franchiseOverview, cities, conflicts, revenue, franchises] = await Promise.all([
            this.franchise.getOverview(),
            this.expansion.listCities(),
            this.territory.listConflicts(),
            this.settlements.listAllSettlements(),
            this.franchise.listFranchises(),
        ]);
        return { success: true, data: { ...franchiseOverview, cities, conflicts, revenue, franchises } };
    }
    async cities() {
        return { success: true, data: await this.expansion.listCities() };
    }
    async franchises(status) {
        return { success: true, data: await this.franchise.listFranchises(status) };
    }
    async conflicts() {
        return { success: true, data: await this.territory.listConflicts() };
    }
    async createFranchise(dto) {
        return { success: true, data: await this.franchise.createFranchise(dto) };
    }
    async updateFranchise(id, dto, user) {
        return { success: true, data: await this.franchise.updateFranchise(id, dto, user.id) };
    }
    async cityLaunch(dto) {
        const plan = await this.expansion.createCityLaunch(dto);
        await this.expansion.triggerLaunchCampaign(dto.city, dto.state);
        return { success: true, data: plan };
    }
};
exports.AdminExpansionController = AdminExpansionController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('cities'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "cities", null);
__decorate([
    (0, common_1.Get)('franchises'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "franchises", null);
__decorate([
    (0, common_1.Get)('conflicts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "conflicts", null);
__decorate([
    (0, common_1.Post)('franchise'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [franchise_dto_1.CreateFranchiseDto]),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "createFranchise", null);
__decorate([
    (0, common_1.Patch)('franchise/:id'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, franchise_dto_1.UpdateFranchiseDto, Object]),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "updateFranchise", null);
__decorate([
    (0, common_1.Post)('city-launch'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [franchise_dto_1.CreateCityLaunchDto]),
    __metadata("design:returntype", Promise)
], AdminExpansionController.prototype, "cityLaunch", null);
exports.AdminExpansionController = AdminExpansionController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/expansion'),
    __metadata("design:paramtypes", [franchise_service_1.FranchiseService,
        territory_service_1.TerritoryService,
        expansion_service_1.ExpansionService,
        franchise_analytics_service_1.FranchiseAnalyticsService,
        franchise_settlement_service_1.FranchiseSettlementService])
], AdminExpansionController);
let AdminFranchiseAnalyticsController = class AdminFranchiseAnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    async franchiseAnalytics() {
        return { success: true, data: await this.analytics.getAdminFranchiseAnalytics() };
    }
};
exports.AdminFranchiseAnalyticsController = AdminFranchiseAnalyticsController;
__decorate([
    (0, common_1.Get)('franchise'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFranchiseAnalyticsController.prototype, "franchiseAnalytics", null);
exports.AdminFranchiseAnalyticsController = AdminFranchiseAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/analytics'),
    __metadata("design:paramtypes", [franchise_analytics_service_1.FranchiseAnalyticsService])
], AdminFranchiseAnalyticsController);
//# sourceMappingURL=admin-expansion.controller.js.map