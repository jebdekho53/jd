import { forwardRef, Module } from '@nestjs/common';
import { FoodCartService } from './food-cart.service';
import { FoodCartController } from './food-cart.controller';
import { FoodCheckoutService } from './food-checkout.service';
import { FoodCheckoutController } from './food-checkout.controller';
import { FoodPaymentService } from './food-payment.service';
import { FoodPaymentController } from './food-payment.controller';
import { MenuService } from './menu.service';
import { FoodOrderService } from './food-order.service';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { MenuOcrService } from './menu-ocr.service';
import { MenuAiService } from './menu-ai.service';
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
import { BuyerModule } from '../buyer/buyer.module';
import { CategoryGovernanceModule } from '../category-governance/category-governance.module';
import { StoreVerticalModule } from '../store-vertical/store-vertical.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    GeospatialModule,
    LogisticsModule,
    OrderTimelineModule,
    MerchantModule,
    BuyerModule,
    CategoryGovernanceModule,
    StoreVerticalModule,
    forwardRef(() => ProductModule),
    PushModule,
    EmailModule,
    forwardRef(() => PaymentModule),
    forwardRef(() => FinanceModule),
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
    RestaurantDiscoveryService,
    MenuOcrService,
    MenuAiService,
  ],
  exports: [
    StoreVerticalModule,
    FoodCartService,
    FoodPaymentService,
    MenuService,
    RestaurantDiscoveryService,
  ],
})
export class FoodModule {}
