import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { RazorpayService } from './razorpay.service';
import { CheckoutModule } from '../checkout/checkout.module';
import { PushModule } from '../push/push.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [CheckoutModule, PushModule, FinanceModule],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService],
  exports: [PaymentService],
})
export class PaymentModule {}
