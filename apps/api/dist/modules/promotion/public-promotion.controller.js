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
exports.PublicPromotionController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const constants_1 = require("../../common/constants");
const store_promotion_service_1 = require("./store-promotion.service");
const offer_engine_service_1 = require("./offer-engine.service");
const campaign_analytics_service_1 = require("./campaign-analytics.service");
const campaign_dto_1 = require("./dto/campaign.dto");
let PublicPromotionController = class PublicPromotionController {
    constructor(promotions, offers, analytics) {
        this.promotions = promotions;
        this.offers = offers;
        this.analytics = analytics;
    }
    async topDeals() {
        const data = await this.promotions.getTopDeals();
        return { success: true, data };
    }
    async trendingDeals() {
        const data = await this.promotions.getTrendingOffers();
        return { success: true, data };
    }
    async freeDeliveryStores() {
        const data = await this.promotions.getFreeDeliveryStores();
        return { success: true, data };
    }
    async storeOffers(slug) {
        const data = await this.promotions.listStoreOffers(slug);
        return { success: true, data };
    }
    async storeCoupons(slug) {
        const data = await this.promotions.listStoreCoupons(slug);
        return { success: true, data };
    }
    async flashSales(limit) {
        const data = await this.offers.getFlashSales(limit ? Number(limit) : 12);
        return { success: true, data };
    }
    async offersNearYou(lat, lng, limit) {
        const data = await this.offers.getOffersNearYou(Number(lat), Number(lng), limit ? Number(limit) : 12);
        return { success: true, data };
    }
    async trackEvent(dto) {
        await this.analytics.trackEvent({
            campaignId: dto.campaignId,
            offerId: dto.offerId,
            eventType: dto.eventType,
        });
        return { success: true };
    }
};
exports.PublicPromotionController = PublicPromotionController;
__decorate([
    (0, common_1.Get)('deals/top'),
    (0, swagger_1.ApiOperation)({ summary: 'Top deals across stores' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "topDeals", null);
__decorate([
    (0, common_1.Get)('deals/trending'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "trendingDeals", null);
__decorate([
    (0, common_1.Get)('deals/free-delivery'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "freeDeliveryStores", null);
__decorate([
    (0, common_1.Get)('stores/:slug/offers'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "storeOffers", null);
__decorate([
    (0, common_1.Get)('stores/:slug/coupons'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "storeCoupons", null);
__decorate([
    (0, common_1.Get)('offers/flash-sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Active flash sales with countdown' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "flashSales", null);
__decorate([
    (0, common_1.Get)('offers/near-you'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "offersNearYou", null);
__decorate([
    (0, common_1.Post)('campaigns/events'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [campaign_dto_1.TrackCampaignEventDto]),
    __metadata("design:returntype", Promise)
], PublicPromotionController.prototype, "trackEvent", null);
exports.PublicPromotionController = PublicPromotionController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [store_promotion_service_1.StorePromotionService,
        offer_engine_service_1.OfferEngineService,
        campaign_analytics_service_1.CampaignAnalyticsService])
], PublicPromotionController);
//# sourceMappingURL=public-promotion.controller.js.map