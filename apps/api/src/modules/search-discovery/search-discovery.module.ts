import { Module } from '@nestjs/common';
import { BuyerModule } from '../buyer/buyer.module';
import { CartModule } from '../cart/cart.module';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { AdsModule } from '../ads/ads.module';
import { SeoModule } from '../seo/seo.module';
import { SearchDiscoveryService } from './search-discovery.service';
import { SearchCacheService } from './search-cache.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { BuyerSearchController, BuyerDiscoverController } from './buyer-search.controller';
import { AdminSearchAnalyticsController } from './admin-search-analytics.controller';
import { MerchantSearchInsightsController } from './merchant-search-insights.controller';

@Module({
  imports: [BuyerModule, CartModule, MerchantDashboardModule, AdsModule, SeoModule],
  controllers: [
    BuyerSearchController,
    BuyerDiscoverController,
    AdminSearchAnalyticsController,
    MerchantSearchInsightsController,
  ],
  providers: [SearchDiscoveryService, SearchCacheService, SearchAnalyticsService],
  exports: [SearchDiscoveryService, SearchCacheService, SearchAnalyticsService],
})
export class SearchDiscoveryModule {}
