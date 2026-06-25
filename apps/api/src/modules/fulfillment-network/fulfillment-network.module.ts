import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { SmartFulfillmentService } from './smart-fulfillment.service';
import { CapacityService } from './capacity.service';
import { InventoryTransferService } from './inventory-transfer.service';
import { RebalancingService } from './rebalancing.service';
import { FulfillmentNetworkService } from './fulfillment-network.service';
import { AdminFulfillmentNetworkService } from './admin-fulfillment-network.service';
import { MerchantFulfillmentNetworkController } from './merchant-fulfillment-network.controller';
import { AdminFulfillmentNetworkController } from './admin-fulfillment-network.controller';

@Module({
  imports: [MerchantDashboardModule],
  controllers: [MerchantFulfillmentNetworkController, AdminFulfillmentNetworkController],
  providers: [
    SmartFulfillmentService,
    CapacityService,
    InventoryTransferService,
    RebalancingService,
    FulfillmentNetworkService,
    AdminFulfillmentNetworkService,
  ],
  exports: [SmartFulfillmentService, CapacityService],
})
export class FulfillmentNetworkModule {}
