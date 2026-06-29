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
exports.BuyerRestaurantController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const restaurant_discovery_service_1 = require("./restaurant-discovery.service");
const menu_service_1 = require("./menu.service");
const client_1 = require("@prisma/client");
let BuyerRestaurantController = class BuyerRestaurantController {
    constructor(discovery, menu) {
        this.discovery = discovery;
        this.menu = menu;
    }
    getVerticals() {
        return { success: true, data: this.discovery.getHomeVerticals() };
    }
    async listRestaurants(lat, lng, pincode, cuisineSlug, vertical, page, limit) {
        const data = await this.discovery.listRestaurants({
            lat: lat ? Number(lat) : undefined,
            lng: lng ? Number(lng) : undefined,
            pincode: pincode?.trim() || undefined,
            cuisineSlug,
            vertical,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        return { success: true, data };
    }
    async getRestaurant(slug) {
        const data = await this.discovery.getRestaurantDetail(slug);
        return { success: true, data };
    }
    async getMenu(slug) {
        const data = await this.menu.getBuyerMenu(slug);
        return { success: true, data };
    }
    async listCuisines() {
        const data = await this.discovery.listCuisines();
        return { success: true, data };
    }
};
exports.BuyerRestaurantController = BuyerRestaurantController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('verticals'),
    (0, swagger_1.ApiOperation)({ summary: 'Homepage vertical navigation tabs' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BuyerRestaurantController.prototype, "getVerticals", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('restaurants'),
    (0, swagger_1.ApiOperation)({ summary: 'List nearby restaurants' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('pincode')),
    __param(3, (0, common_1.Query)('cuisine')),
    __param(4, (0, common_1.Query)('vertical')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], BuyerRestaurantController.prototype, "listRestaurants", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('restaurants/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Restaurant detail page' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuyerRestaurantController.prototype, "getRestaurant", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('restaurants/:slug/menu'),
    (0, swagger_1.ApiOperation)({ summary: 'Full restaurant menu with addons and combos' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuyerRestaurantController.prototype, "getMenu", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('cuisines'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BuyerRestaurantController.prototype, "listCuisines", null);
exports.BuyerRestaurantController = BuyerRestaurantController = __decorate([
    (0, swagger_1.ApiTags)('food / discovery'),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [restaurant_discovery_service_1.RestaurantDiscoveryService,
        menu_service_1.MenuService])
], BuyerRestaurantController);
//# sourceMappingURL=buyer-restaurant.controller.js.map