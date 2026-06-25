import { Module, forwardRef } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { PromotionPricingService } from './promotion-pricing.service';
import { PromotionCartService } from './promotion-cart.service';
import { StorePromotionService } from './store-promotion.service';
import { PromotionNotificationService } from './promotion-notification.service';
import { OfferCacheService } from './offer-cache.service';
import { OfferEvaluatorService } from './offer-evaluator.service';
import { OfferEngineService } from './offer-engine.service';
import { CampaignService } from './campaign.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { BuyerPromotionController } from './buyer-promotion.controller';
import { PublicPromotionController } from './public-promotion.controller';
import { MerchantPromotionController } from './merchant-promotion.controller';
import { MerchantCampaignController } from './merchant-campaign.controller';
import { AdminPromotionController } from './admin-promotion.controller';
import { AdminCampaignController } from './admin-campaign.controller';

@Module({
  imports: [forwardRef(() => CartModule)],
  controllers: [
    BuyerPromotionController,
    PublicPromotionController,
    MerchantPromotionController,
    MerchantCampaignController,
    AdminPromotionController,
    AdminCampaignController,
  ],
  providers: [
    PromotionPricingService,
    PromotionCartService,
    StorePromotionService,
    PromotionNotificationService,
    OfferCacheService,
    OfferEvaluatorService,
    OfferEngineService,
    CampaignService,
    CampaignAnalyticsService,
  ],
  exports: [
    StorePromotionService,
    PromotionPricingService,
    PromotionCartService,
    OfferEngineService,
    OfferCacheService,
    CampaignService,
  ],
})
export class PromotionModule {}
