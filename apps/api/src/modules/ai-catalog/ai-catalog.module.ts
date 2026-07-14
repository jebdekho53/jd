import { Module } from '@nestjs/common';
import { AiCatalogQueueModule } from './queue/ai-catalog-queue.module';
import { MerchantModule } from '../merchant/merchant.module';
import { ProductModule } from '../product/product.module';
import { WebSocketModule } from '../../common/websocket/websocket.module';
import { AI_CATALOG_PROVIDER_BINDINGS, AI_CATALOG_SERVICES } from './ai-catalog.providers';
import { AiCatalogAdminService } from './services/ai-catalog-admin.service';
import { AiCatalogGateway } from './gateway/ai-catalog.gateway';
import { MerchantAiCatalogController } from './controllers/merchant-ai-catalog.controller';
import { AdminAiCatalogController } from './controllers/admin-ai-catalog.controller';

/**
 * API-process module for AI Catalog v2. Registers the queues (as producers),
 * all services, the admin surface, the WS gateway and both controllers. It does
 * NOT register BullMQ processors — those run only in the worker process (see
 * AiCatalogWorkerModule) so the API never consumes jobs. Everything is dormant
 * until the `feature.enabled` flag is turned on (default off).
 */
@Module({
  imports: [AiCatalogQueueModule, MerchantModule, ProductModule, WebSocketModule],
  controllers: [MerchantAiCatalogController, AdminAiCatalogController],
  providers: [...AI_CATALOG_PROVIDER_BINDINGS, ...AI_CATALOG_SERVICES, AiCatalogAdminService, AiCatalogGateway],
  exports: [...AI_CATALOG_SERVICES],
})
export class AiCatalogModule {}
