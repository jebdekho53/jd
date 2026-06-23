import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ReservationService } from './reservation.service';
import { CheckoutController } from './checkout.controller';
import { IdempotencyMiddleware } from './idempotency.middleware';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [CartModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, ReservationService],
  exports: [CheckoutService, ReservationService],
})
export class CheckoutModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes(
        { path: 'buyer/checkout', method: RequestMethod.POST },
        { path: 'buyer/checkout/cod', method: RequestMethod.POST },
        { path: 'payments/razorpay/create-order', method: RequestMethod.POST },
        { path: 'payments/razorpay/verify', method: RequestMethod.POST },
      );
  }
}
