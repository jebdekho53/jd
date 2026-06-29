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
exports.AdminLocationDirectoryController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const location_directory_service_1 = require("./location-directory.service");
const location_directory_dto_1 = require("./dto/location-directory.dto");
let AdminLocationDirectoryController = class AdminLocationDirectoryController {
    constructor(locations) {
        this.locations = locations;
    }
    async list(query) {
        const data = await this.locations.adminList(query);
        return { success: true, data };
    }
    async stats() {
        const data = await this.locations.adminStats();
        return { success: true, data };
    }
    async export(res) {
        const csv = await this.locations.exportCsv();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="master-locations.csv"');
        res.send(csv);
    }
    async import(body) {
        const data = await this.locations.importCsv(body.csv);
        return { success: true, data };
    }
    async setActive(id, body) {
        const data = await this.locations.setPincodeActive(id, body.isActive);
        return { success: true, data };
    }
};
exports.AdminLocationDirectoryController = AdminLocationDirectoryController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('locations:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List master location pincodes with filters' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [location_directory_dto_1.ListAdminLocationsDto]),
    __metadata("design:returntype", Promise)
], AdminLocationDirectoryController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('locations:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Coverage statistics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminLocationDirectoryController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.Permissions)('locations:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Export master locations CSV' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminLocationDirectoryController.prototype, "export", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, permissions_decorator_1.Permissions)('locations:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Import master locations CSV' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [location_directory_dto_1.ImportLocationsDto]),
    __metadata("design:returntype", Promise)
], AdminLocationDirectoryController.prototype, "import", null);
__decorate([
    (0, common_1.Patch)('pincodes/:id/active'),
    (0, permissions_decorator_1.Permissions)('locations:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable or disable a pincode' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, location_directory_dto_1.SetLocationActiveDto]),
    __metadata("design:returntype", Promise)
], AdminLocationDirectoryController.prototype, "setActive", null);
exports.AdminLocationDirectoryController = AdminLocationDirectoryController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/locations'),
    __metadata("design:paramtypes", [location_directory_service_1.LocationDirectoryService])
], AdminLocationDirectoryController);
//# sourceMappingURL=admin-location-directory.controller.js.map