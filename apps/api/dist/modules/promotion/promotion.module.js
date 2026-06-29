"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionModule = void 0;
const common_1 = require("@nestjs/common");
const cart_module_1 = require("../cart/cart.module");
const promotion_pricing_service_1 = require("./promotion-pricing.service");
const promotion_cart_service_1 = require("./promotion-cart.service");
const store_promotion_service_1 = require("./store-promotion.service");
const promotion_notification_service_1 = require("./promotion-notification.service");
const offer_cache_service_1 = require("./offer-cache.service");
const offer_evaluator_service_1 = require("./offer-evaluator.service");
const offer_engine_service_1 = require("./offer-engine.service");
const campaign_service_1 = require("./campaign.service");
const campaign_analytics_service_1 = require("./campaign-analytics.service");
const buyer_promotion_controller_1 = require("./buyer-promotion.controller");
const public_promotion_controller_1 = require("./public-promotion.controller");
const merchant_promotion_controller_1 = require("./merchant-promotion.controller");
const merchant_campaign_controller_1 = require("./merchant-campaign.controller");
const admin_promotion_controller_1 = require("./admin-promotion.controller");
const admin_campaign_controller_1 = require("./admin-campaign.controller");
let PromotionModule = class PromotionModule {
};
exports.PromotionModule = PromotionModule;
exports.PromotionModule = PromotionModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => cart_module_1.CartModule)],
        controllers: [
            buyer_promotion_controller_1.BuyerPromotionController,
            public_promotion_controller_1.PublicPromotionController,
            merchant_promotion_controller_1.MerchantPromotionController,
            merchant_campaign_controller_1.MerchantCampaignController,
            admin_promotion_controller_1.AdminPromotionController,
            admin_campaign_controller_1.AdminCampaignController,
        ],
        providers: [
            promotion_pricing_service_1.PromotionPricingService,
            promotion_cart_service_1.PromotionCartService,
            store_promotion_service_1.StorePromotionService,
            promotion_notification_service_1.PromotionNotificationService,
            offer_cache_service_1.OfferCacheService,
            offer_evaluator_service_1.OfferEvaluatorService,
            offer_engine_service_1.OfferEngineService,
            campaign_service_1.CampaignService,
            campaign_analytics_service_1.CampaignAnalyticsService,
        ],
        exports: [
            store_promotion_service_1.StorePromotionService,
            promotion_pricing_service_1.PromotionPricingService,
            promotion_cart_service_1.PromotionCartService,
            offer_engine_service_1.OfferEngineService,
            offer_cache_service_1.OfferCacheService,
            campaign_service_1.CampaignService,
        ],
    })
], PromotionModule);
//# sourceMappingURL=promotion.module.js.map