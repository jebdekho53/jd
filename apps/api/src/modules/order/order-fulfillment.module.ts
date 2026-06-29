import { Module } from '@nestjs/common';
import { SettlementModule } from '../settlement/settlement.module';
import { FinanceModule } from '../finance/finance.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';
import { PushModule } from '../push/push.module';
import { OrderDeliveredHandlerService } from './order-delivered-handler.service';

@Module({
  imports: [
    SettlementModule,
    FinanceModule,
    CheckoutModule,
    ComplianceModule,
    TrustSafetyModule,
    WalletLoyaltyModule,
    PushModule,
  ],
  providers: [OrderDeliveredHandlerService],
  exports: [OrderDeliveredHandlerService],
})
export class OrderFulfillmentModule {}
