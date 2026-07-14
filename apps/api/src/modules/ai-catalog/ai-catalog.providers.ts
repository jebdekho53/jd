import { Provider } from '@nestjs/common';
import { AI_IMAGE_PROVIDER, AI_VISION_PROVIDER } from './providers/ai-provider.interface';
import { OpenAiCatalogProvider } from './providers/openai-catalog.provider';
import { AiCatalogConfigService } from './services/ai-catalog-config.service';
import { AiCatalogImageProcessingService } from './services/ai-catalog-image-processing.service';
import { AiCatalogImageAssetService } from './services/ai-catalog-image-asset.service';
import { AiCatalogCategoryService } from './services/ai-catalog-category.service';
import { AiCatalogModerationService } from './services/ai-catalog-moderation.service';
import { AiCatalogProgressService } from './services/ai-catalog-progress.service';
import { AiCatalogBillingService } from './services/ai-catalog-billing.service';
import { AiCatalogAttributeRegistryService } from './services/ai-catalog-attribute-registry.service';
import { AiCatalogAttributeService } from './services/ai-catalog-attribute.service';
import { AiCatalogImageService } from './services/ai-catalog-image.service';
import { AiCatalogAnalysisService } from './services/ai-catalog-analysis.service';

/**
 * Shared DI bindings used by BOTH the API module and the worker module so the
 * two processes construct identical service graphs. The OpenAI adapter is bound
 * once and shared behind both the vision and image provider tokens.
 */
export const AI_CATALOG_PROVIDER_BINDINGS: Provider[] = [
  OpenAiCatalogProvider,
  { provide: AI_VISION_PROVIDER, useExisting: OpenAiCatalogProvider },
  { provide: AI_IMAGE_PROVIDER, useExisting: OpenAiCatalogProvider },
];

export const AI_CATALOG_SERVICES: Provider[] = [
  AiCatalogConfigService,
  AiCatalogImageProcessingService,
  AiCatalogImageAssetService,
  AiCatalogCategoryService,
  AiCatalogModerationService,
  AiCatalogProgressService,
  AiCatalogBillingService,
  AiCatalogAttributeRegistryService,
  AiCatalogAttributeService,
  AiCatalogImageService,
  AiCatalogAnalysisService,
];
