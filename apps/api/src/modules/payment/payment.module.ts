import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { RazorpayService } from './razorpay.service';
import { CheckoutModule } from '../checkout/checkout.module';
import { PushModule } from '../push/push.module';
import { FinanceModule } from '../finance/finance.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { FoodModule } from '../food/food.module';

@Module({
  imports: [CheckoutModule, PushModule, FinanceModule, LogisticsModule, forwardRef(() => FoodModule)],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService],
  exports: [PaymentService, RazorpayService],
})
export class PaymentModule {}
