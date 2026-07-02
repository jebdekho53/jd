import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ReservationService } from './reservation.service';
import { OrderExpiryService } from './order-expiry.service';
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
import { LocationDirectoryModule } from '../location-directory/location-directory.module';
import { PushModule } from '../push/push.module';
import { LogisticsModule } from '../logistics/logistics.module';

@Module({
  imports: [
    CartModule,
    InventoryModule,
    PromotionModule,
    GeospatialModule,
    WalletLoyaltyModule,
    FinanceModule,
    TrustSafetyModule,
    FulfillmentNetworkModule,
    CorporateModule,
    LocationDirectoryModule,
    PushModule,
    forwardRef(() => LogisticsModule),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, ReservationService, OrderExpiryService],
  exports: [CheckoutService, ReservationService, OrderExpiryService],
})
export class CheckoutModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes(
        { path: 'buyer/checkout', method: RequestMethod.POST },
        { path: 'buyer/checkout/cod', method: RequestMethod.POST },
        { path: 'buyer/food-checkout', method: RequestMethod.POST },
        { path: 'buyer/food-checkout/cod', method: RequestMethod.POST },
        { path: 'buyer/food-checkout/razorpay/create-order/:checkoutId', method: RequestMethod.POST },
        { path: 'buyer/food-checkout/razorpay/verify', method: RequestMethod.POST },
        { path: 'buyer/food-checkout/razorpay/sync/:checkoutId', method: RequestMethod.POST },
      );
  }
}
