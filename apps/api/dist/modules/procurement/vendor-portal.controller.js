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
exports.VendorPortalController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const vendor_portal_service_1 = require("./vendor-portal.service");
const procurement_dto_1 = require("./dto/procurement.dto");
let VendorPortalController = class VendorPortalController {
    constructor(vendor) {
        this.vendor = vendor;
    }
    async orders(user) {
        return { success: true, data: await this.vendor.listOrders(user.id) };
    }
    async ship(user, id, dto) {
        return { success: true, data: await this.vendor.shipOrder(user.id, id, dto) };
    }
    async deliver(user, id) {
        return { success: true, data: await this.vendor.deliverOrder(user.id, id) };
    }
    async catalog(user) {
        return { success: true, data: await this.vendor.getCatalog(user.id) };
    }
    async createProduct(user, dto) {
        return { success: true, data: await this.vendor.createProduct(user.id, dto) };
    }
};
exports.VendorPortalController = VendorPortalController;
__decorate([
    (0, common_1.Get)('orders'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VendorPortalController.prototype, "orders", null);
__decorate([
    (0, common_1.Patch)('orders/:id/ship'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, procurement_dto_1.ShipVendorOrderDto]),
    __metadata("design:returntype", Promise)
], VendorPortalController.prototype, "ship", null);
__decorate([
    (0, common_1.Patch)('orders/:id/deliver'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorPortalController.prototype, "deliver", null);
__decorate([
    (0, common_1.Get)('catalog'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VendorPortalController.prototype, "catalog", null);
__decorate([
    (0, common_1.Post)('catalog/products'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.CreateVendorProductDto]),
    __metadata("design:returntype", Promise)
], VendorPortalController.prototype, "createProduct", null);
exports.VendorPortalController = VendorPortalController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Controller)('vendor'),
    __metadata("design:paramtypes", [vendor_portal_service_1.VendorPortalService])
], VendorPortalController);
//# sourceMappingURL=vendor-portal.controller.js.map