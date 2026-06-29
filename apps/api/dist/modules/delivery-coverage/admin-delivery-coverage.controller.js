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
exports.AdminDeliveryCoverageController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const delivery_coverage_service_1 = require("./delivery-coverage.service");
const delivery_coverage_dto_1 = require("./dto/delivery-coverage.dto");
let AdminDeliveryCoverageController = class AdminDeliveryCoverageController {
    constructor(coverage) {
        this.coverage = coverage;
    }
    async overview() {
        const data = await this.coverage.getAdminOverview();
        return { success: true, data };
    }
    async search(query) {
        const data = await this.coverage.adminSearchCoverage(query);
        return { success: true, data };
    }
    async setPincodeActive(user, pincode, body) {
        const data = await this.coverage.adminSetPincodeActive(pincode, body.isActive, user.id);
        return { success: true, data };
    }
    async adminImport(body) {
        const data = await this.coverage.adminImportCsv(body.storeId, body.csv ?? '');
        return { success: true, data };
    }
};
exports.AdminDeliveryCoverageController = AdminDeliveryCoverageController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('locations:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform-wide delivery coverage overview' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDeliveryCoverageController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, permissions_decorator_1.Permissions)('locations:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Search store delivery coverage rows' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delivery_coverage_dto_1.AdminCoverageSearchDto]),
    __metadata("design:returntype", Promise)
], AdminDeliveryCoverageController.prototype, "search", null);
__decorate([
    (0, common_1.Patch)('pincodes/:pincode/active'),
    (0, permissions_decorator_1.Permissions)('locations:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable or disable a master pincode platform-wide' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('pincode')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminDeliveryCoverageController.prototype, "setPincodeActive", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, permissions_decorator_1.Permissions)('locations:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin bulk import coverage for a store' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminDeliveryCoverageController.prototype, "adminImport", null);
exports.AdminDeliveryCoverageController = AdminDeliveryCoverageController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/delivery-coverage'),
    __metadata("design:paramtypes", [delivery_coverage_service_1.DeliveryCoverageService])
], AdminDeliveryCoverageController);
//# sourceMappingURL=admin-delivery-coverage.controller.js.map