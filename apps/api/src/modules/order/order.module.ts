import { Module } from '@nestjs/common';
import { RiderAssignmentModule } from '../rider-assignment/rider-assignment.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { InventoryModule } from '../inventory/inventory.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';
import { FinanceModule } from '../finance/finance.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { PushModule } from '../push/push.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryTrackingModule } from '../delivery-tracking/delivery-tracking.module';
import { OrderFulfillmentModule } from './order-fulfillment.module';
import { OrderService } from './order.service';
import { BuyerOrderController } from './buyer-order.controller';
import { MerchantOrderController } from './merchant-order.controller';
import { AdminOrderController } from './admin-order.controller';

@Module({
  imports: [RiderAssignmentModule, LogisticsModule, CheckoutModule, InventoryModule, WalletLoyaltyModule, FinanceModule, ComplianceModule, PushModule, PaymentModule, DeliveryTrackingModule, OrderFulfillmentModule],
  controllers: [BuyerOrderController, MerchantOrderController, AdminOrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
