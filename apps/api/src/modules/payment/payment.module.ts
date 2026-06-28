import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { RazorpayService } from './razorpay.service';
import { CheckoutModule } from '../checkout/checkout.module';
import { PushModule } from '../push/push.module';
import { FinanceModule } from '../finance/finance.module';
import { LogisticsModule } from '../logistics/logistics.module';

@Module({
  imports: [CheckoutModule, PushModule, FinanceModule, LogisticsModule],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService],
  exports: [PaymentService, RazorpayService],
})
export class PaymentModule {}
