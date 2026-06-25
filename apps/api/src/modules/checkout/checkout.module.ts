import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ReservationService } from './reservation.service';
import { CheckoutController } from './checkout.controller';
import { IdempotencyMiddleware } from './idempotency.middleware';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PromotionModule } from '../promotion/promotion.module';
import { GeospatialModule } from '../geospatial/geospatial.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';
import { FinanceModule } from '../finance/finance.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { FulfillmentNetworkModule } from '../fulfillment-network/fulfillment-network.module';
import { CorporateModule } from '../corporate/corporate.module';

@Module({
  imports: [CartModule, InventoryModule, PromotionModule, GeospatialModule, WalletLoyaltyModule, FinanceModule, TrustSafetyModule, FulfillmentNetworkModule, CorporateModule],
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
