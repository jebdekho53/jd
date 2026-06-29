import { Module, forwardRef } from '@nestjs/common';
import { RiderAssignmentModule } from '../rider-assignment/rider-assignment.module';
import { OrderFulfillmentModule } from '../order/order-fulfillment.module';
import { ShadowfaxClient } from './providers/shadowfax/shadowfax.client';
import { ShadowfaxProvider } from './providers/shadowfax/shadowfax.provider';
import { PorterProvider, DelhiveryProvider, BorzoProvider } from './providers/stub/stub-providers';
import { OwnFleetProvider } from './providers/own-fleet/own-fleet.provider';
import { LogisticsProviderRegistry } from './logistics-provider.registry';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { DeliveryDispatchService } from './delivery-dispatch.service';
import { ShadowfaxWebhookService } from './webhooks/shadowfax-webhook.service';
import { LogisticsWebhookController } from './webhooks/logistics-webhook.controller';
import { MerchantLogisticsController } from './merchant-logistics.controller';
import { AdminLogisticsController } from './admin-logistics.controller';

@Module({
  imports: [RiderAssignmentModule, forwardRef(() => OrderFulfillmentModule)],
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
    BorzoProvider,
    OwnFleetProvider,
    LogisticsProviderRegistry,
    DeliveryOrchestratorService,
    DeliveryDispatchService,
    ShadowfaxWebhookService,
  ],
  exports: [DeliveryDispatchService, DeliveryOrchestratorService, LogisticsProviderRegistry],
})
export class LogisticsModule {}
