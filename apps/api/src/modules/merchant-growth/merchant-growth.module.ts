import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { StoreReviewModule } from '../store-review/store-review.module';
import { SearchDiscoveryModule } from '../search-discovery/search-discovery.module';
import { CrmModule } from '../crm/crm.module';
import { StoreHealthService } from './store-health.service';
import { GrowthRecommendationsService } from './growth-recommendations.service';
import { GrowthAlertService } from './growth-alert.service';
import { MerchantGrowthService } from './merchant-growth.service';
import { AdminMerchantSuccessService } from './admin-merchant-success.service';
import { MerchantGrowthController } from './merchant-growth.controller';
import { AdminMerchantSuccessController } from './admin-merchant-success.controller';

@Module({
  imports: [MerchantDashboardModule, StoreReviewModule, SearchDiscoveryModule, CrmModule],
  controllers: [MerchantGrowthController, AdminMerchantSuccessController],
  providers: [
    StoreHealthService,
    GrowthRecommendationsService,
    GrowthAlertService,
    MerchantGrowthService,
    AdminMerchantSuccessService,
  ],
  exports: [MerchantGrowthService, StoreHealthService],
})
export class MerchantGrowthModule {}
