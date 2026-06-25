import { Module } from '@nestjs/common';
import { BuyerWalletController } from './buyer-wallet.controller';
import { AdminRewardsController } from './admin-rewards.controller';
import { MerchantLoyaltyController } from './merchant-loyalty.controller';
import { WalletService } from './wallet.service';
import { RewardService } from './reward.service';
import { ReferralService } from './referral.service';
import { FraudService } from './fraud.service';
import { RewardConfigService } from './reward-config.service';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { MembershipModule } from '../membership/membership.module';
import { WalletLoyaltyCheckoutService } from './wallet-loyalty-checkout.service';

@Module({
  imports: [TrustSafetyModule, MembershipModule],
  controllers: [BuyerWalletController, AdminRewardsController, MerchantLoyaltyController],
  providers: [
    WalletService,
    RewardService,
    ReferralService,
    FraudService,
    RewardConfigService,
    WalletLoyaltyCheckoutService,
  ],
  exports: [
    WalletService,
    RewardService,
    ReferralService,
    WalletLoyaltyCheckoutService,
  ],
})
export class WalletLoyaltyModule {}
