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
exports.MerchantInventoryController = void 0;
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
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
const update_inventory_dto_1 = require("../product/dto/update-inventory.dto");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_service_1 = require("../merchant/merchant.service");
let MerchantInventoryController = class MerchantInventoryController {
    constructor(inventory, prisma, merchantService) {
        this.inventory = inventory;
        this.prisma = prisma;
        this.merchantService = merchantService;
    }
    async list(user, storeId, dto) {
        await this.assertStore(user.id, storeId);
        const data = await this.inventory.listStoreInventory({ storeId, ...dto });
        return { success: true, data };
    }
    async adjust(user, storeId, variantId, dto, ip) {
        await this.assertVariantInStore(user.id, storeId, variantId);
        const data = await this.inventory.adjustAvailableQty(variantId, dto.quantity, dto.lowStockThreshold, user.id);
        return { success: true, data };
    }
    async bulkAdjust(user, storeId, dto, ip) {
        await this.assertStore(user.id, storeId);
        const results = [];
        for (const variantId of dto.variantIds) {
            await this.assertVariantInStore(user.id, storeId, variantId);
            results.push(await this.inventory.adjustAvailableQty(variantId, dto.availableQty, undefined, user.id));
        }
        return { success: true, data: results };
    }
    async disable(user, storeId, variantId) {
        await this.assertVariantInStore(user.id, storeId, variantId);
        await this.inventory.setStatus(variantId, client_1.InventoryStatus.DISABLED);
        return { success: true };
    }
    async assertStore(userId, storeId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
    }
    async assertVariantInStore(userId, storeId, variantId) {
        await this.assertStore(userId, storeId);
        const variant = await this.prisma.productVariant.findFirst({
            where: { id: variantId, product: { storeId, deletedAt: null } },
        });
        if (!variant)
            throw new common_1.NotFoundException('Variant not found in store');
    }
};
exports.MerchantInventoryController = MerchantInventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('inventory:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List store inventory with filters' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inventory_dto_1.ListStoreInventoryDto]),
    __metadata("design:returntype", Promise)
], MerchantInventoryController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)('variants/:variantId'),
    (0, permissions_decorator_1.Permissions)('inventory:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust available stock for a variant' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('variantId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_inventory_dto_1.UpdateInventoryDto, String]),
    __metadata("design:returntype", Promise)
], MerchantInventoryController.prototype, "adjust", null);
__decorate([
    (0, common_1.Post)('bulk-adjust'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('inventory:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk set available stock for multiple variants' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inventory_dto_1.BulkAdjustInventoryDto, String]),
    __metadata("design:returntype", Promise)
], MerchantInventoryController.prototype, "bulkAdjust", null);
__decorate([
    (0, common_1.Patch)('variants/:variantId/disable'),
    (0, permissions_decorator_1.Permissions)('inventory:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Disable product variant inventory (stops sales)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('variantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantInventoryController.prototype, "disable", null);
exports.MerchantInventoryController = MerchantInventoryController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores/:storeId/inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        prisma_service_1.PrismaService,
        merchant_service_1.MerchantService])
], MerchantInventoryController);
//# sourceMappingURL=merchant-inventory.controller.js.map