import { Module } from '@nestjs/common';
import { RiderAssignmentModule } from '../rider-assignment/rider-assignment.module';
import { DeliveryTrackingModule } from '../delivery-tracking/delivery-tracking.module';
import { DeliveryService } from './delivery.service';
import { RiderLocationService } from './rider-location.service';
import { RiderController } from './rider.controller';
import { AdminRiderController } from './admin-rider.controller';
import { OrderFulfillmentModule } from '../order/order-fulfillment.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { OrderTimelineModule } from '../order/order-timeline.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';

import { FinanceModule } from '../finance/finance.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [RiderAssignmentModule, DeliveryTrackingModule, OrderFulfillmentModule, FinanceModule, CheckoutModule, OrderTimelineModule, PushModule],
  controllers: [RiderController, AdminRiderController],
  providers: [DeliveryService, RiderLocationService],
  exports: [DeliveryService, RiderAssignmentModule],
})
export class RiderModule {}
