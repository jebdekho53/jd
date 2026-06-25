import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { CorporateAccountService } from './corporate-account.service';
import { ApprovalService } from './approval.service';
import { CorporateWalletService } from './corporate-wallet.service';
import { CorporateBillingService } from './corporate-billing.service';
import { CorporateAnalyticsService } from './corporate-analytics.service';
import { CorporatePortalController } from './corporate-portal.controller';
import { AdminCorporateController, AdminCorporateAnalyticsController } from './admin-corporate.controller';

@Module({
  imports: [FinanceModule],
  controllers: [CorporatePortalController, AdminCorporateController, AdminCorporateAnalyticsController],
  providers: [
    CorporateAccountService,
    ApprovalService,
    CorporateWalletService,
    CorporateBillingService,
    CorporateAnalyticsService,
  ],
  exports: [CorporateAccountService, ApprovalService, CorporateWalletService, CorporateBillingService],
})
export class CorporateModule {}
