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
exports.AdminStoreGeoController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const geospatial_service_1 = require("./geospatial.service");
const geospatial_dto_1 = require("./dto/geospatial.dto");
let AdminStoreGeoController = class AdminStoreGeoController {
    constructor(geo) {
        this.geo = geo;
    }
    async updateRadius(user, storeId, dto) {
        const data = await this.geo.updateStoreRadius(user.id, storeId, dto);
        return { success: true, data };
    }
};
exports.AdminStoreGeoController = AdminStoreGeoController;
__decorate([
    (0, common_1.Patch)(':id/delivery-radius'),
    (0, swagger_1.ApiOperation)({ summary: 'Set store delivery radius and locality' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, geospatial_dto_1.UpdateStoreRadiusDto]),
    __metadata("design:returntype", Promise)
], AdminStoreGeoController.prototype, "updateRadius", null);
exports.AdminStoreGeoController = AdminStoreGeoController = __decorate([
    (0, swagger_1.ApiTags)('admin / stores / geo'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/stores'),
    __metadata("design:paramtypes", [geospatial_service_1.GeospatialService])
], AdminStoreGeoController);
//# sourceMappingURL=admin-store-geo.controller.js.map