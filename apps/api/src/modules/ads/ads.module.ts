import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { CrmModule } from '../crm/crm.module';
import { AdServingService } from './ad-serving.service';
import { KeywordAuctionService } from './keyword-auction.service';
import { AdAnalyticsService } from './ad-analytics.service';
import { AdBudgetService } from './ad-budget.service';
import { AdFraudGuardService } from './ad-fraud-guard.service';
import { MerchantAdsController } from './merchant-ads.controller';
import { BuyerAdsController } from './buyer-ads.controller';
import { AdminAdsController, AdminAdsAnalyticsController } from './admin-ads.controller';

@Module({
  imports: [MerchantDashboardModule, TrustSafetyModule, CrmModule],
  controllers: [MerchantAdsController, BuyerAdsController, AdminAdsController, AdminAdsAnalyticsController],
  providers: [
    AdServingService,
    KeywordAuctionService,
    AdAnalyticsService,
    AdBudgetService,
    AdFraudGuardService,
  ],
  exports: [AdServingService, KeywordAuctionService, AdAnalyticsService, AdBudgetService],
})
export class AdsModule {}
