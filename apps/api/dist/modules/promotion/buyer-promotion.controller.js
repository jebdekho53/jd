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
exports.BuyerPromotionController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const cart_service_1 = require("../cart/cart.service");
const promotion_cart_service_1 = require("./promotion-cart.service");
const offer_engine_service_1 = require("./offer-engine.service");
const promotion_dto_1 = require("./dto/promotion.dto");
let BuyerPromotionController = class BuyerPromotionController {
    constructor(cartService, promoCart, offers) {
        this.cartService = cartService;
        this.promoCart = promoCart;
        this.offers = offers;
    }
    async validateCoupon(user, dto) {
        const cart = await this.cartService.getCart(user.id);
        if (!cart)
            return { success: true, data: { valid: false, message: 'Cart is empty' } };
        const buyerProfileId = await this.cartService.getBuyerProfileId(user.id);
        const result = await this.promoCart.validateCoupon(buyerProfileId, dto.code, cart);
        return { success: true, data: result };
    }
    async applyCoupon(user, dto) {
        await this.promoCart.applyCoupon(user.id, dto.code);
        await this.cartService.invalidateCache(user.id);
        const data = await this.cartService.getCart(user.id);
        return { success: true, data };
    }
    async removeCoupon(user) {
        await this.promoCart.removeCoupon(user.id);
        await this.cartService.invalidateCache(user.id);
        const data = await this.cartService.getCart(user.id);
        return { success: true, data };
    }
    async recommended(user, lat, lng) {
        const buyerProfileId = await this.cartService.getBuyerProfileId(user.id);
        const data = await this.offers.getPersonalizedOffers(buyerProfileId, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
        return { success: true, data };
    }
};
exports.BuyerPromotionController = BuyerPromotionController;
__decorate([
    (0, common_1.Post)('cart/coupon/validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate a coupon against the current cart' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, promotion_dto_1.ApplyCouponDto]),
    __metadata("design:returntype", Promise)
], BuyerPromotionController.prototype, "validateCoupon", null);
__decorate([
    (0, common_1.Post)('cart/coupon/apply'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, promotion_dto_1.ApplyCouponDto]),
    __metadata("design:returntype", Promise)
], BuyerPromotionController.prototype, "applyCoupon", null);
__decorate([
    (0, common_1.Delete)('cart/coupon'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerPromotionController.prototype, "removeCoupon", null);
__decorate([
    (0, common_1.Get)('offers/recommended'),
    (0, swagger_1.ApiOperation)({ summary: 'Personalized offers for the authenticated buyer' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('lat')),
    __param(2, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BuyerPromotionController.prototype, "recommended", null);
exports.BuyerPromotionController = BuyerPromotionController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [cart_service_1.CartService,
        promotion_cart_service_1.PromotionCartService,
        offer_engine_service_1.OfferEngineService])
], BuyerPromotionController);
//# sourceMappingURL=buyer-promotion.controller.js.map