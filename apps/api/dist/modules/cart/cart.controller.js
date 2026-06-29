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
exports.CartController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const cart_service_1 = require("./cart.service");
const add_cart_item_dto_1 = require("./dto/add-cart-item.dto");
const update_cart_item_dto_1 = require("./dto/update-cart-item.dto");
let CartController = class CartController {
    constructor(cartService) {
        this.cartService = cartService;
    }
    async getCart(user) {
        const data = await this.cartService.getCart(user.id);
        return { success: true, data };
    }
    async addItem(user, dto, ip) {
        const data = await this.cartService.addItem(user.id, dto, ip);
        return { success: true, data };
    }
    async updateItem(user, cartItemId, dto, ip) {
        const data = await this.cartService.updateItem(user.id, cartItemId, dto, ip);
        return { success: true, data };
    }
    async removeItem(user, cartItemId, ip) {
        const data = await this.cartService.removeItem(user.id, cartItemId, ip);
        return { success: true, data };
    }
    async clearCart(user, ip) {
        await this.cartService.clearCart(user.id, ip);
        return { success: true, data: { message: 'Cart cleared' } };
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current buyer cart with totals' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active cart or null if no cart exists' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCart", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a variant to the cart',
        description: 'Creates the cart if it does not exist. Returns 409 if the item is from a different store.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated cart' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Out of stock or requested qty exceeds available stock' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Item is from a different store than current cart' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_cart_item_dto_1.AddCartItemDto, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addItem", null);
__decorate([
    (0, common_1.Patch)('items/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cart item ID' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update item quantity. Setting quantity to 0 removes the item.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_cart_item_dto_1.UpdateCartItemDto, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Cart item ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a single item from the cart' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Clear the entire cart (removes all items and deletes the cart)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "clearCart", null);
exports.CartController = CartController = __decorate([
    (0, swagger_1.ApiTags)('cart'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/cart'),
    __metadata("design:paramtypes", [cart_service_1.CartService])
], CartController);
//# sourceMappingURL=cart.controller.js.map