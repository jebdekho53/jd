import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { SearchDiscoveryModule } from '../search-discovery/search-discovery.module';
import { PurchaseRecommendationService } from './purchase-recommendation.service';
import { ProcurementMarketplaceService } from './procurement-marketplace.service';
import { ProcurementCartService } from './procurement-cart.service';
import { ProcurementOrderService } from './procurement-order.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';
import { VendorPortalService } from './vendor-portal.service';
import { AdminSupplyChainService } from './admin-supply-chain.service';
import { MerchantProcurementController } from './merchant-procurement.controller';
import { VendorPortalController } from './vendor-portal.controller';
import { AdminSupplyChainController } from './admin-supply-chain.controller';

@Module({
  imports: [MerchantDashboardModule, SearchDiscoveryModule],
  controllers: [MerchantProcurementController, VendorPortalController, AdminSupplyChainController],
  providers: [
    PurchaseRecommendationService,
    ProcurementMarketplaceService,
    ProcurementCartService,
    ProcurementOrderService,
    ProcurementAnalyticsService,
    VendorPortalService,
    AdminSupplyChainService,
  ],
  exports: [PurchaseRecommendationService, ProcurementOrderService],
})
export class ProcurementModule {}
