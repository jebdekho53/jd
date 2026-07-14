import { Module } from '@nestjs/common';
import { AiCatalogQueueModule } from './queue/ai-catalog-queue.module';
import { MerchantModule } from '../merchant/merchant.module';
import { ProductModule } from '../product/product.module';
import { AI_CATALOG_PROVIDER_BINDINGS, AI_CATALOG_SERVICES } from './ai-catalog.providers';
import { AiCatalogJobLifecycleService } from './workers/job-lifecycle.service';
import { AnalysisProcessor } from './workers/analysis.processor';
import { ImageProcessor } from './workers/image.processor';
import { ModerationProcessor } from './workers/moderation.processor';
import { RetryProcessor } from './workers/retry.processor';

/**
 * Worker-process module. Registers the same service graph as the API module
 * PLUS the four BullMQ processors that actually consume jobs. Loaded only by
 * worker.bootstrap.ts — never imported by the API AppModule — so job execution
 * is fully isolated to dedicated worker processes.
 */
@Module({
  imports: [AiCatalogQueueModule, MerchantModule, ProductModule],
  providers: [
    ...AI_CATALOG_PROVIDER_BINDINGS,
    ...AI_CATALOG_SERVICES,
    AiCatalogJobLifecycleService,
    AnalysisProcessor,
    ImageProcessor,
    ModerationProcessor,
    RetryProcessor,
  ],
})
export class AiCatalogWorkerModule {}
