import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { RazorpayService } from './razorpay.service';
import { OrderRefundService } from './order-refund.service';
import { RefundRetryScheduler } from './refund-retry.scheduler';
import { CheckoutModule } from '../checkout/checkout.module';
import { PushModule } from '../push/push.module';
import { FinanceModule } from '../finance/finance.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { FoodModule } from '../food/food.module';

@Module({
  imports: [
    CheckoutModule,
    PushModule,
    FinanceModule,
    ComplianceModule,
    WalletLoyaltyModule,
    LogisticsModule,
    forwardRef(() => FoodModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService, OrderRefundService, RefundRetryScheduler],
  exports: [PaymentService, RazorpayService, OrderRefundService],
})
export class PaymentModule {}
