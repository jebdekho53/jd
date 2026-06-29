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
exports.FoodCartController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const food_cart_service_1 = require("./food-cart.service");
const add_food_cart_item_dto_1 = require("./dto/add-food-cart-item.dto");
let FoodCartController = class FoodCartController {
    constructor(foodCart) {
        this.foodCart = foodCart;
    }
    async getCart(user) {
        const data = await this.foodCart.getFoodCart(user.id);
        return { success: true, data };
    }
    async addItem(user, dto) {
        const data = await this.foodCart.addItem(user.id, dto);
        return { success: true, data };
    }
    async updateItem(user, id, dto) {
        const data = await this.foodCart.updateItem(user.id, id, dto);
        return { success: true, data };
    }
    async removeItem(user, id) {
        const data = await this.foodCart.removeItem(user.id, id);
        return { success: true, data };
    }
    async clearCart(user) {
        const data = await this.foodCart.clearCart(user.id);
        return { success: true, data };
    }
};
exports.FoodCartController = FoodCartController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get food cart (separate from grocery cart)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FoodCartController.prototype, "getCart", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_food_cart_item_dto_1.AddFoodCartItemDto]),
    __metadata("design:returntype", Promise)
], FoodCartController.prototype, "addItem", null);
__decorate([
    (0, common_1.Patch)('items/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_food_cart_item_dto_1.UpdateFoodCartItemDto]),
    __metadata("design:returntype", Promise)
], FoodCartController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FoodCartController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Delete)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FoodCartController.prototype, "clearCart", null);
exports.FoodCartController = FoodCartController = __decorate([
    (0, swagger_1.ApiTags)('food / cart'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/food-cart'),
    __metadata("design:paramtypes", [food_cart_service_1.FoodCartService])
], FoodCartController);
//# sourceMappingURL=food-cart.controller.js.map