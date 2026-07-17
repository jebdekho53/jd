import { Module } from '@nestjs/common';
import { LegalModule } from '../legal/legal.module';
import { FinanceModule } from '../finance/finance.module';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { PaymentModule } from '../payment/payment.module';
import { FranchiseService } from './franchise.service';
import { FranchiseStoreLinkService } from './franchise-store-link.service';
import { TerritoryService } from './territory.service';
import { ExpansionService } from './expansion.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
import { FranchisePayoutService } from './franchise-payout.service';
import { FranchiseBankAccountService } from './franchise-bank-account.service';
import { FranchiseKycService } from './franchise-kyc.service';
import { FranchiseNotificationService } from './franchise-notification.service';
import { EmailModule } from '../email/email.module';
import { MarketingModule } from '../marketing/marketing.module';
import { PasswordService } from '../auth/password.service';
import { FranchiseExpansionMerchantService } from './franchise-expansion-merchant.service';
import { AdminExpansionController, AdminFranchiseAnalyticsController } from './admin-expansion.controller';
import { FranchisePortalController } from './franchise-portal.controller';
import { PublicFranchiseController } from './public-franchise.controller';
import { FranchiseApplicationService } from './franchise-application.service';
import { MerchantFranchiseExpansionController } from './merchant-franchise-expansion.controller';

@Module({
  // PaymentModule gives us RazorpayService (Route linked accounts + transfers) —
  // the same rail merchants are already paid on.
  imports: [LegalModule, FinanceModule, MerchantDashboardModule, PaymentModule, EmailModule, MarketingModule],
  controllers: [
    AdminExpansionController,
    AdminFranchiseAnalyticsController,
    FranchisePortalController,
    PublicFranchiseController,
    MerchantFranchiseExpansionController,
  ],
  providers: [
    FranchiseStoreLinkService,
    // Stateless argon2 wrapper with no deps — provided directly rather than
    // importing AuthModule, which would create a cycle.
    PasswordService,
    FranchiseService,
    TerritoryService,
    ExpansionService,
    FranchiseAnalyticsService,
    FranchiseSettlementService,
    FranchisePayoutService,
    FranchiseBankAccountService,
    FranchiseKycService,
    FranchiseNotificationService,
    FranchiseExpansionMerchantService,
    FranchiseApplicationService,
  ],
  exports: [FranchiseService, FranchiseStoreLinkService, TerritoryService, ExpansionService, FranchiseAnalyticsService, FranchiseApplicationService],
})
export class FranchiseModule {}
