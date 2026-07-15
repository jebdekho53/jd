import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { FinanceModule } from '../finance/finance.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { MerchantModule } from '../merchant/merchant.module';
import { RiderAssignmentModule } from '../rider-assignment/rider-assignment.module';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { ClaimRefundService } from './claim-refund.service';
import { ClaimReplacementService } from './claim-replacement.service';
import { ClaimNotificationService } from './claim-notification.service';
import { ReturnPickupService } from './return-pickup.service';
import { OrderClaimService } from './order-claim.service';
import { BuyerOrderClaimController } from './buyer-order-claim.controller';
import { MerchantClaimController } from './merchant-claim.controller';
import { AdminClaimController } from './admin-claim.controller';
import { RiderReturnPickupController } from './rider-return-pickup.controller';

@Module({
  imports: [
    PaymentModule,
    FinanceModule,
    WalletLoyaltyModule,
    ComplianceModule,
    LogisticsModule,
    MerchantModule,
    RiderAssignmentModule,
  ],
  controllers: [
    BuyerOrderClaimController,
    MerchantClaimController,
    AdminClaimController,
    RiderReturnPickupController,
  ],
  providers: [
    ClaimEligibilityService,
    ClaimRefundService,
    ClaimReplacementService,
    ClaimNotificationService,
    ReturnPickupService,
    OrderClaimService,
  ],
  exports: [OrderClaimService, ClaimEligibilityService],
})
export class OrderClaimModule {}
