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
exports.MerchantDeliveryCoverageController = void 0;
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
let MerchantDeliveryCoverageController = class MerchantDeliveryCoverageController {
    constructor(coverage) {
        this.coverage = coverage;
    }
    async list(user, storeId, query) {
        const data = await this.coverage.listForStore(user.id, storeId, query);
        return { success: true, data };
    }
    async analytics(user, storeId) {
        const data = await this.coverage.getMerchantAnalytics(user.id, storeId);
        return { success: true, data };
    }
    async export(user, storeId) {
        const csv = await this.coverage.exportCsv(user.id, storeId);
        return { success: true, data: { csv } };
    }
    async add(user, storeId, dto) {
        const data = await this.coverage.addArea(user.id, storeId, dto);
        return { success: true, data };
    }
    async bulkAdd(user, storeId, dto) {
        const data = await this.coverage.bulkAdd(user.id, storeId, dto);
        return { success: true, data };
    }
    async importCsv(user, storeId, body) {
        const data = await this.coverage.importCsv(user.id, storeId, body.csv ?? '');
        return { success: true, data };
    }
    async update(user, storeId, areaId, dto) {
        const data = await this.coverage.updateArea(user.id, storeId, areaId, dto);
        return { success: true, data };
    }
    async remove(user, storeId, areaId) {
        const data = await this.coverage.removeArea(user.id, storeId, areaId);
        return { success: true, data };
    }
};
exports.MerchantDeliveryCoverageController = MerchantDeliveryCoverageController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List delivery coverage pincodes for a store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, delivery_coverage_dto_1.ListDeliveryAreasDto]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Coverage analytics for merchant' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Export delivery coverage CSV' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "export", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a pincode to delivery coverage' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, delivery_coverage_dto_1.AddDeliveryAreaDto]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "add", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk add pincodes to delivery coverage' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, delivery_coverage_dto_1.BulkAddDeliveryAreasDto]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "bulkAdd", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Import delivery coverage from CSV' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Patch)(':areaId'),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Update delivery area settings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('areaId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, delivery_coverage_dto_1.UpdateDeliveryAreaDto]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':areaId'),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove pincode from delivery coverage' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantDeliveryCoverageController.prototype, "remove", null);
exports.MerchantDeliveryCoverageController = MerchantDeliveryCoverageController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.STORES),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores/:storeId/delivery-coverage'),
    __metadata("design:paramtypes", [delivery_coverage_service_1.DeliveryCoverageService])
], MerchantDeliveryCoverageController);
//# sourceMappingURL=merchant-delivery-coverage.controller.js.map