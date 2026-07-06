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
exports.AdminAiProductUsageController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const admin_ai_product_usage_service_1 = require("./admin-ai-product-usage.service");
let AdminAiProductUsageController = class AdminAiProductUsageController {
    constructor(usage) {
        this.usage = usage;
    }
    async stats(merchantProfileId, storeId) {
        const data = await this.usage.getStats({ merchantProfileId, storeId });
        return { success: true, data };
    }
    async exportCsv(status, merchantProfileId, storeId, lowConfidence, charged, failed) {
        return this.usage.exportCsv({
            status,
            merchantProfileId,
            storeId,
            lowConfidence: lowConfidence === 'true',
            charged: charged === 'true',
            failed: failed === 'true',
        });
    }
    async list(status, merchantProfileId, storeId, lowConfidence, charged, failed, page, limit) {
        const data = await this.usage.list({
            status,
            merchantProfileId,
            storeId,
            lowConfidence: lowConfidence === 'true',
            charged: charged === 'true',
            failed: failed === 'true',
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 50,
        });
        return { success: true, data };
    }
    async detail(analysisId) {
        const data = await this.usage.getDetail(analysisId);
        return { success: true, data };
    }
};
exports.AdminAiProductUsageController = AdminAiProductUsageController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, swagger_1.ApiOperation)({ summary: 'AI product usage summary stats' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('merchantProfileId')),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminAiProductUsageController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="ai-product-usage.csv"'),
    (0, swagger_1.ApiOperation)({ summary: 'Export AI product usage as CSV' }),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('merchantProfileId')),
    __param(2, (0, common_1.Query)('storeId')),
    __param(3, (0, common_1.Query)('lowConfidence')),
    __param(4, (0, common_1.Query)('charged')),
    __param(5, (0, common_1.Query)('failed')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof client_1.AIProductAnalysisStatus !== "undefined" && client_1.AIProductAnalysisStatus) === "function" ? _a : Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAiProductUsageController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List AI product usage across merchants' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('merchantProfileId')),
    __param(2, (0, common_1.Query)('storeId')),
    __param(3, (0, common_1.Query)('lowConfidence')),
    __param(4, (0, common_1.Query)('charged')),
    __param(5, (0, common_1.Query)('failed')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof client_1.AIProductAnalysisStatus !== "undefined" && client_1.AIProductAnalysisStatus) === "function" ? _b : Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAiProductUsageController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':analysisId'),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, swagger_1.ApiOperation)({ summary: 'AI product analysis detail' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('analysisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAiProductUsageController.prototype, "detail", null);
exports.AdminAiProductUsageController = AdminAiProductUsageController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/ai-product-usage'),
    __metadata("design:paramtypes", [admin_ai_product_usage_service_1.AdminAiProductUsageService])
], AdminAiProductUsageController);
//# sourceMappingURL=admin-ai-product-usage.controller.js.map