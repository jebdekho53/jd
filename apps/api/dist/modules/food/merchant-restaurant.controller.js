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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantFoodOrderController = exports.MerchantRestaurantController = void 0;
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
const food_order_service_1 = require("./food-order.service");
const menu_service_1 = require("./menu.service");
const menu_ocr_service_1 = require("./menu-ocr.service");
const create_menu_category_dto_1 = require("./dto/create-menu-category.dto");
const create_menu_item_dto_1 = require("./dto/create-menu-item.dto");
const create_addon_group_dto_1 = require("./dto/create-addon-group.dto");
const create_combo_dto_1 = require("./dto/create-combo.dto");
const merchant_service_1 = require("../merchant/merchant.service");
let MerchantRestaurantController = class MerchantRestaurantController {
    constructor(menu, foodOrder, menuOcr, merchantService) {
        this.menu = menu;
        this.foodOrder = foodOrder;
        this.menuOcr = menuOcr;
        this.merchantService = merchantService;
    }
    async profileId(userId) {
        const p = await this.merchantService.requireMerchantProfile(userId);
        return p.id;
    }
    async getMenu(user, storeId) {
        const data = await this.menu.getMerchantMenu(await this.profileId(user.id), storeId);
        return { success: true, data };
    }
    async listCategories(user, storeId) {
        const data = await this.menu.listCategories(await this.profileId(user.id), storeId);
        return { success: true, data };
    }
    async createCategory(user, storeId, dto) {
        const data = await this.menu.createCategory(await this.profileId(user.id), storeId, dto);
        return { success: true, data };
    }
    async createItem(user, storeId, dto) {
        const data = await this.menu.createMenuItem(await this.profileId(user.id), storeId, dto);
        return { success: true, data };
    }
    async createAddonGroup(user, storeId, dto) {
        const data = await this.menu.createAddonGroup(await this.profileId(user.id), storeId, dto);
        return { success: true, data };
    }
    async linkAddon(user, storeId, menuItemId, groupId) {
        const data = await this.menu.linkAddonGroupToItem(await this.profileId(user.id), storeId, menuItemId, groupId);
        return { success: true, data };
    }
    async createCombo(user, storeId, dto) {
        const data = await this.menu.createCombo(await this.profileId(user.id), storeId, dto);
        return { success: true, data };
    }
    async kitchenQueue(user, storeId) {
        const data = await this.foodOrder.getKitchenQueue(user.id, storeId);
        return { success: true, data };
    }
    async updateKitchenStatus(user, _storeId, orderId, status) {
        const data = await this.foodOrder.updateKitchenStatus(user.id, orderId, status);
        return { success: true, data };
    }
    async dashboard(user, storeId) {
        const data = await this.foodOrder.getRestaurantDashboard(user.id, storeId);
        return { success: true, data };
    }
    async uploadMenuOcr(user, storeId, imageUrl) {
        const data = await this.menuOcr.uploadMenuForOcr(await this.profileId(user.id), storeId, imageUrl);
        return { success: true, data };
    }
    async getOcrJob(user, storeId, jobId) {
        const data = await this.menuOcr.getJob(await this.profileId(user.id), storeId, jobId);
        return { success: true, data };
    }
    async publishOcr(user, storeId, jobId) {
        const data = await this.menuOcr.publishDraftMenu(await this.profileId(user.id), storeId, jobId);
        return { success: true, data };
    }
};
exports.MerchantRestaurantController = MerchantRestaurantController;
__decorate([
    (0, common_1.Get)('menu'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "getMenu", null);
__decorate([
    (0, common_1.Get)('menu/categories'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('menu/categories'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_category_dto_1.CreateMenuCategoryDto]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Post)('menu/items'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_item_dto_1.CreateMenuItemDto]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "createItem", null);
__decorate([
    (0, common_1.Post)('menu/addon-groups'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_addon_group_dto_1.CreateAddonGroupDto]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "createAddonGroup", null);
__decorate([
    (0, common_1.Post)('menu/items/:menuItemId/addon-groups/:groupId'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('menuItemId')),
    __param(3, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "linkAddon", null);
__decorate([
    (0, common_1.Post)('menu/combos'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_combo_dto_1.CreateComboDto]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "createCombo", null);
__decorate([
    (0, common_1.Get)('kitchen/queue'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "kitchenQueue", null);
__decorate([
    (0, common_1.Patch)('kitchen/orders/:orderId/status'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('orderId')),
    __param(3, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, typeof (_a = typeof client_1.FoodKitchenStatus !== "undefined" && client_1.FoodKitchenStatus) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "updateKitchenStatus", null);
__decorate([
    (0, common_1.Get)('restaurant/dashboard'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Post)('menu/ocr'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)('imageUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "uploadMenuOcr", null);
__decorate([
    (0, common_1.Get)('menu/ocr/:jobId'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "getOcrJob", null);
__decorate([
    (0, common_1.Post)('menu/ocr/:jobId/publish'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantRestaurantController.prototype, "publishOcr", null);
exports.MerchantRestaurantController = MerchantRestaurantController = __decorate([
    (0, swagger_1.ApiTags)('merchant / restaurant'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores/:storeId'),
    __metadata("design:paramtypes", [menu_service_1.MenuService,
        food_order_service_1.FoodOrderService,
        menu_ocr_service_1.MenuOcrService,
        merchant_service_1.MerchantService])
], MerchantRestaurantController);
let MerchantFoodOrderController = class MerchantFoodOrderController {
    constructor(foodOrder) {
        this.foodOrder = foodOrder;
    }
    async accept(user, orderId) {
        const data = await this.foodOrder.transitionFoodOrder(user.id, orderId, client_1.OrderStatus.MERCHANT_ACCEPTED);
        return { success: true, data };
    }
    async preparing(user, orderId) {
        const data = await this.foodOrder.transitionFoodOrder(user.id, orderId, client_1.OrderStatus.PREPARING);
        return { success: true, data };
    }
    async ready(user, orderId) {
        const data = await this.foodOrder.transitionFoodOrder(user.id, orderId, client_1.OrderStatus.READY_FOR_PICKUP);
        return { success: true, data };
    }
};
exports.MerchantFoodOrderController = MerchantFoodOrderController;
__decorate([
    (0, common_1.Patch)(':orderId/accept'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantFoodOrderController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':orderId/preparing'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantFoodOrderController.prototype, "preparing", null);
__decorate([
    (0, common_1.Patch)(':orderId/ready'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantFoodOrderController.prototype, "ready", null);
exports.MerchantFoodOrderController = MerchantFoodOrderController = __decorate([
    (0, swagger_1.ApiTags)('merchant / food orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/food-orders'),
    __metadata("design:paramtypes", [food_order_service_1.FoodOrderService])
], MerchantFoodOrderController);
//# sourceMappingURL=merchant-restaurant.controller.js.map