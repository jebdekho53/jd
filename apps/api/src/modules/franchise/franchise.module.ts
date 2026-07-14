import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { FranchiseService } from './franchise.service';
import { TerritoryService } from './territory.service';
import { ExpansionService } from './expansion.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
import { PasswordService } from '../auth/password.service';
import { FranchiseExpansionMerchantService } from './franchise-expansion-merchant.service';
import { AdminExpansionController, AdminFranchiseAnalyticsController } from './admin-expansion.controller';
import { FranchisePortalController } from './franchise-portal.controller';
import { PublicFranchiseController } from './public-franchise.controller';
import { FranchiseApplicationService } from './franchise-application.service';
import { MerchantFranchiseExpansionController } from './merchant-franchise-expansion.controller';

@Module({
  imports: [FinanceModule, MerchantDashboardModule],
  controllers: [
    AdminExpansionController,
    AdminFranchiseAnalyticsController,
    FranchisePortalController,
    PublicFranchiseController,
    MerchantFranchiseExpansionController,
  ],
  providers: [
    // Stateless argon2 wrapper with no deps — provided directly rather than
    // importing AuthModule, which would create a cycle.
    PasswordService,
    FranchiseService,
    TerritoryService,
    ExpansionService,
    FranchiseAnalyticsService,
    FranchiseSettlementService,
    FranchiseExpansionMerchantService,
    FranchiseApplicationService,
  ],
  exports: [FranchiseService, TerritoryService, ExpansionService, FranchiseAnalyticsService, FranchiseApplicationService],
})
export class FranchiseModule {}
