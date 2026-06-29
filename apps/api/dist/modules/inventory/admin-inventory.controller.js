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
exports.AdminInventoryController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
let AdminInventoryController = class AdminInventoryController {
    constructor(inventory) {
        this.inventory = inventory;
    }
    async list(dto) {
        const data = await this.inventory.listAdminInventory(dto);
        return { success: true, data };
    }
    async analytics() {
        const data = await this.inventory.getGlobalAnalytics();
        return { success: true, data };
    }
};
exports.AdminInventoryController = AdminInventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Audit view of all store inventory (read-only)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.ListAdminInventoryDto]),
    __metadata("design:returntype", Promise)
], AdminInventoryController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Global inventory analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminInventoryController.prototype, "analytics", null);
exports.AdminInventoryController = AdminInventoryController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], AdminInventoryController);
//# sourceMappingURL=admin-inventory.controller.js.map