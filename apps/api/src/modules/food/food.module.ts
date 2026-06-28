import { forwardRef, Module } from '@nestjs/common';
import { FoodCartService } from './food-cart.service';
import { FoodCartController } from './food-cart.controller';
import { FoodCheckoutService } from './food-checkout.service';
import { FoodCheckoutController } from './food-checkout.controller';
import { FoodPaymentService } from './food-payment.service';
import { FoodPaymentController } from './food-payment.controller';
import { MenuService } from './menu.service';
import { FoodOrderService } from './food-order.service';
import { VerticalService } from './vertical.service';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { MenuOcrService } from './menu-ocr.service';
import { BuyerRestaurantController } from './buyer-restaurant.controller';
import {
  MerchantRestaurantController,
  MerchantFoodOrderController,
} from './merchant-restaurant.controller';
import { AdminRestaurantController } from './admin-restaurant.controller';
import { GeospatialModule } from '../geospatial/geospatial.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { OrderTimelineModule } from '../order/order-timeline.module';
import { MerchantModule } from '../merchant/merchant.module';
import { ProductModule } from '../product/product.module';
import { PaymentModule } from '../payment/payment.module';
import { PushModule } from '../push/push.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    GeospatialModule,
    LogisticsModule,
    OrderTimelineModule,
    MerchantModule,
    ProductModule,
    PushModule,
    EmailModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [
    FoodCartController,
    FoodCheckoutController,
    FoodPaymentController,
    BuyerRestaurantController,
    MerchantRestaurantController,
    MerchantFoodOrderController,
    AdminRestaurantController,
  ],
  providers: [
    FoodCartService,
    FoodCheckoutService,
    FoodPaymentService,
    MenuService,
    FoodOrderService,
    VerticalService,
    RestaurantDiscoveryService,
    MenuOcrService,
  ],
  exports: [FoodCartService, FoodPaymentService, MenuService, VerticalService, RestaurantDiscoveryService],
})
export class FoodModule {}
