import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { FranchiseService } from './franchise.service';
import { TerritoryService } from './territory.service';
import { ExpansionService } from './expansion.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
import { FranchiseExpansionMerchantService } from './franchise-expansion-merchant.service';
import { AdminExpansionController, AdminFranchiseAnalyticsController } from './admin-expansion.controller';
import { FranchisePortalController } from './franchise-portal.controller';
import { MerchantFranchiseExpansionController } from './merchant-franchise-expansion.controller';

@Module({
  imports: [FinanceModule, MerchantDashboardModule],
  controllers: [
    AdminExpansionController,
    AdminFranchiseAnalyticsController,
    FranchisePortalController,
    MerchantFranchiseExpansionController,
  ],
  providers: [
    FranchiseService,
    TerritoryService,
    ExpansionService,
    FranchiseAnalyticsService,
    FranchiseSettlementService,
    FranchiseExpansionMerchantService,
  ],
  exports: [TerritoryService, ExpansionService, FranchiseAnalyticsService],
})
export class FranchiseModule {}
