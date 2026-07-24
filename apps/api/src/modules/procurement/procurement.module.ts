import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { SearchDiscoveryModule } from '../search-discovery/search-discovery.module';
import { PasswordService } from '../auth/password.service';
import { PurchaseRecommendationService } from './purchase-recommendation.service';
import { ProcurementMarketplaceService } from './procurement-marketplace.service';
import { ProcurementCartService } from './procurement-cart.service';
import { ProcurementOrderService } from './procurement-order.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';
import { VendorPortalService } from './vendor-portal.service';
import { AdminSupplyChainService } from './admin-supply-chain.service';
import { VendorApplicationService } from './vendor-application.service';
import { MerchantProcurementController } from './merchant-procurement.controller';
import { VendorPortalController } from './vendor-portal.controller';
import { AdminSupplyChainController } from './admin-supply-chain.controller';
import { PublicVendorApplicationController } from './public-vendor-application.controller';

@Module({
  imports: [MerchantDashboardModule, SearchDiscoveryModule],
  controllers: [
    MerchantProcurementController,
    VendorPortalController,
    AdminSupplyChainController,
    PublicVendorApplicationController,
  ],
  providers: [
    PurchaseRecommendationService,
    ProcurementMarketplaceService,
    ProcurementCartService,
    ProcurementOrderService,
    ProcurementAnalyticsService,
    VendorPortalService,
    AdminSupplyChainService,
    VendorApplicationService,
    PasswordService,
  ],
  exports: [PurchaseRecommendationService, ProcurementOrderService],
})
export class ProcurementModule {}
