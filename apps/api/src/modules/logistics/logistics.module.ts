import { Module, forwardRef } from '@nestjs/common';
import { RiderAssignmentModule } from '../rider-assignment/rider-assignment.module';
import { OrderFulfillmentModule } from '../order/order-fulfillment.module';
import { PushModule } from '../push/push.module';
import { ShadowfaxClient } from './providers/shadowfax/shadowfax.client';
import { ShadowfaxProvider } from './providers/shadowfax/shadowfax.provider';
import { PorterProvider, DelhiveryProvider } from './providers/stub/stub-providers';
import { BorzoClient } from './providers/borzo/borzo.client';
import { BorzoProvider } from './providers/borzo/borzo.provider';
import { OwnFleetProvider } from './providers/own-fleet/own-fleet.provider';
import { LogisticsProviderRegistry } from './logistics-provider.registry';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { DeliveryDispatchService } from './delivery-dispatch.service';
import { ShipmentTrackingScheduler } from './shipment-tracking.scheduler';
import { ShadowfaxWebhookService } from './webhooks/shadowfax-webhook.service';
import { BorzoWebhookService } from './webhooks/borzo-webhook.service';
import { LogisticsWebhookController } from './webhooks/logistics-webhook.controller';
import { MerchantLogisticsController } from './merchant-logistics.controller';
import { AdminLogisticsController } from './admin-logistics.controller';

@Module({
  imports: [RiderAssignmentModule, forwardRef(() => OrderFulfillmentModule), forwardRef(() => PushModule)],
  controllers: [
    LogisticsWebhookController,
    MerchantLogisticsController,
    AdminLogisticsController,
  ],
  providers: [
    ShadowfaxClient,
    ShadowfaxProvider,
    PorterProvider,
    DelhiveryProvider,
    BorzoClient,
    BorzoProvider,
    OwnFleetProvider,
    LogisticsProviderRegistry,
    DeliveryOrchestratorService,
    DeliveryDispatchService,
    ShipmentTrackingScheduler,
    ShadowfaxWebhookService,
    BorzoWebhookService,
  ],
  exports: [DeliveryDispatchService, DeliveryOrchestratorService, LogisticsProviderRegistry],
})
export class LogisticsModule {}
