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
exports.MerchantGeospatialController = exports.AdminGeospatialController = exports.BuyerGeospatialController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const geospatial_util_1 = require("../../common/utils/geospatial.util");
const geospatial_service_1 = require("./geospatial.service");
const geospatial_dto_1 = require("./dto/geospatial.dto");
let BuyerGeospatialController = class BuyerGeospatialController {
    constructor(geo) {
        this.geo = geo;
    }
    async mapStores(dto) {
        const data = await this.geo.getMapStores(dto.lat, dto.lng, dto.radiusKm ?? 10);
        return { success: true, data };
    }
    async deliverability(dto) {
        const data = await this.geo.checkDeliverability(dto);
        return { success: true, data };
    }
    async listAddresses(user) {
        const data = await this.geo.listAddresses(user.id);
        return { success: true, data };
    }
    async createAddress(user, dto) {
        const data = await this.geo.createAddress(user.id, dto);
        return { success: true, data };
    }
    async updateAddress(user, id, dto) {
        const data = await this.geo.updateAddress(user.id, id, dto);
        return { success: true, data };
    }
    async deleteAddress(user, id) {
        const data = await this.geo.deleteAddress(user.id, id);
        return { success: true, data };
    }
};
exports.BuyerGeospatialController = BuyerGeospatialController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('map/stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Map pins for nearby deliverable stores' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [geospatial_dto_1.MapStoresQueryDto]),
    __metadata("design:returntype", Promise)
], BuyerGeospatialController.prototype, "mapStores", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('geo/deliverability'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if a store delivers to coordinates' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [geospatial_dto_1.CheckDeliverabilityDto]),
    __metadata("design:returntype", Promise)
], BuyerGeospatialController.prototype, "deliverability", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Get)('addresses'),
    (0, swagger_1.ApiOperation)({ summary: 'List saved buyer addresses' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerGeospatialController.prototype, "listAddresses", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Post)('addresses'),
    (0, swagger_1.ApiOperation)({ summary: 'Create saved address' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, geospatial_dto_1.CreateAddressDto]),
    __metadata("design:returntype", Promise)
], BuyerGeospatialController.prototype, "createAddress", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Patch)('addresses/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update saved address' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, geospatial_dto_1.UpdateAddressDto]),
    __metadata("design:returntype", Promise)
], BuyerGeospatialController.prototype, "updateAddress", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Delete)('addresses/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete saved address' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerGeospatialController.prototype, "deleteAddress", null);
exports.BuyerGeospatialController = BuyerGeospatialController = __decorate([
    (0, swagger_1.ApiTags)('buyer / geo'),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [geospatial_service_1.GeospatialService])
], BuyerGeospatialController);
let AdminGeospatialController = class AdminGeospatialController {
    constructor(geo) {
        this.geo = geo;
    }
    allowedRadii() {
        return { success: true, data: geospatial_util_1.ALLOWED_DELIVERY_RADII_KM };
    }
    async operationsMap() {
        const data = await this.geo.getOperationsMap();
        return { success: true, data };
    }
    async hotspots() {
        const data = await this.geo.getHotspotAnalytics();
        return { success: true, data };
    }
};
exports.AdminGeospatialController = AdminGeospatialController;
__decorate([
    (0, common_1.Get)('delivery-radii'),
    (0, swagger_1.ApiOperation)({ summary: 'Allowed store delivery radii (km)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminGeospatialController.prototype, "allowedRadii", null);
__decorate([
    (0, common_1.Get)('operations-map'),
    (0, swagger_1.ApiOperation)({ summary: 'Operations control map data' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminGeospatialController.prototype, "operationsMap", null);
__decorate([
    (0, common_1.Get)('hotspots'),
    (0, swagger_1.ApiOperation)({ summary: 'Delivery hotspot analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminGeospatialController.prototype, "hotspots", null);
exports.AdminGeospatialController = AdminGeospatialController = __decorate([
    (0, swagger_1.ApiTags)('admin / geo'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/geo'),
    __metadata("design:paramtypes", [geospatial_service_1.GeospatialService])
], AdminGeospatialController);
let MerchantGeospatialController = class MerchantGeospatialController {
    constructor(geo) {
        this.geo = geo;
    }
    async areaAnalytics(user, storeId) {
        const data = await this.geo.getMerchantAreaAnalytics(user.id, storeId);
        return { success: true, data };
    }
};
exports.MerchantGeospatialController = MerchantGeospatialController;
__decorate([
    (0, common_1.Get)(':storeId/area-analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Top delivery areas for merchant store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantGeospatialController.prototype, "areaAnalytics", null);
exports.MerchantGeospatialController = MerchantGeospatialController = __decorate([
    (0, swagger_1.ApiTags)('merchant / geo'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores'),
    __metadata("design:paramtypes", [geospatial_service_1.GeospatialService])
], MerchantGeospatialController);
//# sourceMappingURL=geospatial.controller.js.map