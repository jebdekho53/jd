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
exports.AdminTrustSafetyController = void 0;
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
const constants_1 = require("../../common/constants");
const trust_safety_service_1 = require("./trust-safety.service");
const trust_alert_service_1 = require("./trust-alert.service");
const fraud_case_service_1 = require("./fraud-case.service");
const trust_safety_dto_1 = require("./dto/trust-safety.dto");
let AdminTrustSafetyController = class AdminTrustSafetyController {
    constructor(trust, alerts, cases) {
        this.trust = trust;
        this.alerts = alerts;
        this.cases = cases;
    }
    async overview() {
        return { success: true, data: await this.trust.getDashboard() };
    }
    async listAlerts() {
        return { success: true, data: await this.alerts.listOpen() };
    }
    async fraudCases(query) {
        const data = await this.trust.listCases(query.category, query.page, query.limit);
        return { success: true, data };
    }
    async fraudCasesByCategory(category, query) {
        const data = await this.trust.listCases(category, query.page, query.limit);
        return { success: true, data };
    }
    async riskProfiles(query) {
        return { success: true, data: await this.trust.listRiskProfiles(query.page, query.limit, query.status) };
    }
    async blocked(query) {
        return { success: true, data: await this.trust.listBlockedAccounts(query.page, query.limit) };
    }
    async action(user, dto) {
        const data = await this.trust.adminAction(user.id, dto.action, dto.userId, dto.reason, dto.caseId);
        return { success: true, data };
    }
    async resolveCase(user, id, resolution, dismiss) {
        const data = await this.cases.resolveCase(id, user.id, resolution, dismiss);
        return { success: true, data };
    }
    async enableCod(user, dto) {
        return { success: true, data: await this.trust.enableCodForBuyer(dto.userId, user.id) };
    }
    async resolveAlert(id) {
        return { success: true, data: await this.alerts.resolve(id) };
    }
};
exports.AdminTrustSafetyController = AdminTrustSafetyController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Trust & safety dashboard' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "listAlerts", null);
__decorate([
    (0, common_1.Get)('fraud-cases'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_safety_dto_1.ListTrustQueryDto]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "fraudCases", null);
__decorate([
    (0, common_1.Get)('fraud-cases/:category'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('category')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_safety_dto_1.ListTrustQueryDto]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "fraudCasesByCategory", null);
__decorate([
    (0, common_1.Get)('risk-profiles'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_safety_dto_1.ListTrustQueryDto]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "riskProfiles", null);
__decorate([
    (0, common_1.Get)('blocked-accounts'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_safety_dto_1.ListTrustQueryDto]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "blocked", null);
__decorate([
    (0, common_1.Post)('actions'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, trust_safety_dto_1.AdminTrustActionDto]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "action", null);
__decorate([
    (0, common_1.Patch)('cases/:id/resolve'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('resolution')),
    __param(3, (0, common_1.Body)('dismiss')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "resolveCase", null);
__decorate([
    (0, common_1.Post)('cod/enable'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, trust_safety_dto_1.EnableCodDto]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "enableCod", null);
__decorate([
    (0, common_1.Patch)('alerts/:id/resolve'),
    (0, permissions_decorator_1.Permissions)('settlements:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTrustSafetyController.prototype, "resolveAlert", null);
exports.AdminTrustSafetyController = AdminTrustSafetyController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/trust-safety'),
    __metadata("design:paramtypes", [trust_safety_service_1.TrustSafetyService,
        trust_alert_service_1.TrustAlertService,
        fraud_case_service_1.FraudCaseService])
], AdminTrustSafetyController);
//# sourceMappingURL=admin-trust-safety.controller.js.map