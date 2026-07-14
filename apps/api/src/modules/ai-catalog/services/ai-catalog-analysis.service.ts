import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AIProductAnalysisStatus, AIProductJobStatus, AIProductType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MerchantService } from '../../merchant/merchant.service';
import { RedisService } from '../../../redis/redis.service';
import { AI_VISION_PROVIDER, AiVisionProvider } from '../providers/ai-provider.interface';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import { AiCatalogImageProcessingService } from './ai-catalog-image-processing.service';
import { AiCatalogCategoryService } from './ai-catalog-category.service';
import { AiCatalogModerationService } from './ai-catalog-moderation.service';
import { AiCatalogProgressService } from './ai-catalog-progress.service';
import { AiCatalogImageService } from './ai-catalog-image.service';
import { AiCatalogBillingService } from './ai-catalog-billing.service';
import { AiCatalogAttributeService } from './ai-catalog-attribute.service';
import { AiCatalogQueueService } from '../queue/ai-catalog-queue.service';
import { ProductService } from '../../product/product.service';
import type { CreateProductDto } from '../../product/dto/create-product.dto';
import { ANALYSIS_PROGRESS, RATE_LIMIT } from '../ai-catalog.constants';
import type { AnalysisJobPayload, ExtractedAttributesV2 } from '../ai-catalog.types';
import type { ConfirmCatalogDto } from '../dto/ai-catalog.dto';

/**
 * Central orchestration for the async analysis pipeline. Split across two entry
 * points: `createAndQueue` (API request → durable rows + enqueue) and
 * `process` (worker → vision, category, moderation, optional image fan-out).
 * The DB is authoritative throughout; the worker only ever acts on persisted
 * state, so a crash/restart resumes cleanly and never double-charges.
 */
@Injectable()
export class AiCatalogAnalysisService {
  private readonly logger = new Logger(AiCatalogAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly redis: RedisService,
    @Inject(AI_VISION_PROVIDER) private readonly vision: AiVisionProvider,
    private readonly config: AiCatalogConfigService,
    private readonly images: AiCatalogImageProcessingService,
    private readonly category: AiCatalogCategoryService,
    private readonly moderation: AiCatalogModerationService,
    private readonly progress: AiCatalogProgressService,
    private readonly imageService: AiCatalogImageService,
    private readonly billing: AiCatalogBillingService,
    private readonly attributes: AiCatalogAttributeService,
    private readonly productService: ProductService,
    private readonly queue: AiCatalogQueueService,
    private readonly audit: AuditService,
  ) {}

  // ── API side: validate, persist, enqueue ─────────────────────────────────────
  async createAndQueue(params: {
    userId: string;
    storeId: string;
    dataUrl: string;
    ipAddress?: string;
    autoGenerateImages: boolean;
  }): Promise<{ analysisId: string; jobLedgerId: string; status: string }> {
    if (!(await this.config.isEnabled())) {
      throw new ServiceUnavailableException({ message: 'AI cataloging v2 is not enabled.', code: 'AI_CATALOG_DISABLED' });
    }
    this.vision.assertConfigured();
    const profile = await this.merchantService.requireMerchantProfile(params.userId);
    await this.assertStoreOwnership(profile.id, params.storeId);
    await this.enforceRateLimit(profile.id);
    await this.enforceDailyLimit(profile.id);

    // Validate + optimize the upload synchronously so bad images fail fast with
    // a clear 400 rather than dying inside a worker.
    const optimized = await this.images.validateAndOptimizeUpload(params.dataUrl);

    const analysis = await this.prisma.aIProductAnalysis.create({
      data: {
        merchantProfileId: profile.id,
        storeId: params.storeId,
        uploadedImageUrl: optimized.optimizedUrl,
        originalImageUrl: optimized.originalUrl,
        optimizedImageUrl: optimized.optimizedUrl,
        thumbnailImageUrl: optimized.thumbnailUrl,
        aiAnalysisImageUrl: optimized.aiAnalysisUrl,
        status: AIProductAnalysisStatus.QUEUED,
        chargeAmountPaise: (await this.config.pricing()).analysisPaise,
        extractedJson: { sourceHash: optimized.sourceHash, version: 2 } as Prisma.InputJsonValue,
      },
    });

    const { jobLedgerId } = await this.queue.enqueueAnalysis({
      analysisId: analysis.id,
      merchantProfileId: profile.id,
      storeId: params.storeId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      autoGenerateImages: params.autoGenerateImages,
    });

    await this.audit.log({
      actorId: params.userId,
      action: 'AI_CATALOG_ANALYSIS_QUEUED',
      resourceType: 'AIProductAnalysis',
      resourceId: analysis.id,
      ipAddress: params.ipAddress,
      metadata: { storeId: params.storeId, jobLedgerId },
    });

    return { analysisId: analysis.id, jobLedgerId, status: AIProductAnalysisStatus.QUEUED };
  }

  // ── Worker side: the actual analysis ─────────────────────────────────────────
  async process(payload: AnalysisJobPayload): Promise<void> {
    const analysis = await this.prisma.aIProductAnalysis.findUnique({ where: { id: payload.analysisId } });
    if (!analysis) throw new NotFoundException('Analysis not found');

    // Idempotency: if already past PROCESSING, this is a duplicate delivery.
    if (
      analysis.status === AIProductAnalysisStatus.COMPLETED ||
      analysis.status === AIProductAnalysisStatus.CONFIRMED ||
      analysis.status === AIProductAnalysisStatus.MODERATION_HOLD
    ) {
      this.logger.debug(`Analysis ${analysis.id} already ${analysis.status}; skipping duplicate`);
      return;
    }

    const emit = (stage: string, pct: number, message?: string) =>
      this.progress.update({
        jobLedgerId: payload.jobLedgerId,
        merchantProfileId: payload.merchantProfileId,
        analysisId: analysis.id,
        stage,
        progress: pct,
        status: AIProductJobStatus.ACTIVE,
        message,
      });

    await this.prisma.aIProductAnalysis.update({
      where: { id: analysis.id },
      data: { status: AIProductAnalysisStatus.PROCESSING },
    });
    await emit('optimizing', ANALYSIS_PROGRESS.OPTIMIZING, 'Preparing image');

    await emit('vision', ANALYSIS_PROGRESS.VISION, 'Understanding product');
    const visionResult = await this.vision.analyze(analysis.aiAnalysisImageUrl ?? analysis.optimizedImageUrl!);
    const extracted = visionResult.attributes;

    await emit('attributes', ANALYSIS_PROGRESS.ATTRIBUTES, 'Extracting attributes');
    await emit('category', ANALYSIS_PROGRESS.CATEGORY, 'Matching category');
    const owner = await this.prisma.store.findUnique({ where: { id: analysis.storeId }, select: { merchantProfile: { select: { userId: true } } } });
    const userId = owner?.merchantProfile?.userId ?? payload.userId;
    const categoryMatch = await this.category.match(analysis.storeId, userId, extracted.categoryTree);

    await emit('moderation', ANALYSIS_PROGRESS.MODERATION, 'Safety checks');
    const moderation = await this.moderation.evaluate(extracted);

    const sourceHash = (analysis.extractedJson as Record<string, unknown> | null)?.sourceHash as string | undefined;
    const finalStatus =
      moderation.decision === 'needs_review'
        ? AIProductAnalysisStatus.MODERATION_HOLD
        : AIProductAnalysisStatus.COMPLETED;

    await this.prisma.aIProductAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: finalStatus,
        confidence: extracted.confidence,
        detectedProductType: this.mapProductType(extracted),
        extractedJson: {
          version: 2,
          sourceHash,
          model: visionResult.model,
          attributes: extracted as unknown as Prisma.InputJsonValue,
          categoryMatch: categoryMatch as unknown as Prisma.InputJsonValue,
          moderation: moderation as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    // Route moderation holds to the admin queue; otherwise optionally fan out
    // the default image outputs.
    if (finalStatus === AIProductAnalysisStatus.MODERATION_HOLD) {
      await this.queue.enqueueModeration({
        analysisId: analysis.id,
        merchantProfileId: payload.merchantProfileId,
        storeId: analysis.storeId,
        userId: payload.userId,
      });
    } else if (payload.autoGenerateImages && extracted.canPublishDirectly && sourceHash) {
      await emit('images', ANALYSIS_PROGRESS.IMAGES_QUEUED, 'Queuing images');
      await this.imageService.queueOutputs({
        analysisId: analysis.id,
        merchantProfileId: payload.merchantProfileId,
        storeId: analysis.storeId,
        userId: payload.userId,
        ipAddress: payload.ipAddress,
        outputTypes: await this.config.defaultOutputs(),
        forceRegenerate: false,
        sourceHash,
        sourceImageUrl: analysis.originalImageUrl ?? analysis.optimizedImageUrl!,
      });
    }

    await this.progress.update({
      jobLedgerId: payload.jobLedgerId,
      merchantProfileId: payload.merchantProfileId,
      analysisId: analysis.id,
      stage: 'done',
      progress: ANALYSIS_PROGRESS.DONE,
      status: AIProductJobStatus.COMPLETED,
      message: finalStatus === AIProductAnalysisStatus.MODERATION_HOLD ? 'Sent for review' : 'Analysis complete',
    });

    await this.prisma.aIProductJob.update({
      where: { id: payload.jobLedgerId },
      data: { status: AIProductJobStatus.COMPLETED, finishedAt: new Date(), result: { finalStatus } as Prisma.InputJsonValue },
    });
  }

  // ── merchant view ─────────────────────────────────────────────────────────────
  async getAnalysisView(userId: string, storeId: string, analysisId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const analysis = await this.prisma.aIProductAnalysis.findFirst({
      where: { id: analysisId, merchantProfileId: profile.id, storeId },
      include: { imageAssets: { orderBy: [{ outputType: 'asc' }, { version: 'desc' }] } },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    const json = (analysis.extractedJson ?? {}) as Record<string, unknown>;
    const attributes = (json.attributes ?? null) as ExtractedAttributesV2 | null;
    return {
      analysisId: analysis.id,
      storeId: analysis.storeId,
      status: analysis.status,
      confidence: analysis.confidence,
      uploadedImageUrl: analysis.uploadedImageUrl,
      thumbnailImageUrl: analysis.thumbnailImageUrl,
      attributes,
      categoryMatch: json.categoryMatch ?? null,
      moderation: json.moderation ?? null,
      imageAssets: analysis.imageAssets.map((a) => ({
        id: a.id,
        outputType: a.outputType,
        version: a.version,
        status: a.status,
        imageUrl: a.imageUrl,
        thumbnailUrl: a.thumbnailUrl,
        transparent: a.transparent,
        approvalStatus: a.approvalStatus,
        isSelected: a.isSelected,
        generationCostPaise: a.generationCostPaise,
        syntheticGeometry: Boolean((a.metadata as Record<string, unknown> | null)?.syntheticGeometry),
      })),
      createdProductId: analysis.createdProductId,
    };
  }

  /**
   * On-demand image generation from the merchant studio. Enforces feature flag,
   * ownership, per-output enablement and wallet balance, then returns per-output
   * status (cache hits are free + already available).
   */
  async requestImages(params: {
    userId: string;
    storeId: string;
    analysisId: string;
    outputTypes: string[];
    forceRegenerate: boolean;
    ipAddress?: string;
  }): Promise<{ outputs: unknown[]; estimate: unknown }> {
    if (!(await this.config.isEnabled())) {
      throw new ServiceUnavailableException({ message: 'AI cataloging v2 is not enabled.', code: 'AI_CATALOG_DISABLED' });
    }
    const profile = await this.merchantService.requireMerchantProfile(params.userId);
    const analysis = await this.prisma.aIProductAnalysis.findFirst({
      where: { id: params.analysisId, merchantProfileId: profile.id, storeId: params.storeId },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    const json = (analysis.extractedJson ?? {}) as Record<string, unknown>;
    const sourceHash = json.sourceHash as string | undefined;
    if (!sourceHash) throw new BadRequestException('Analysis is not ready for image generation yet');

    const outputs = await this.imageService.queueOutputs({
      analysisId: analysis.id,
      merchantProfileId: profile.id,
      storeId: params.storeId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      outputTypes: params.outputTypes,
      forceRegenerate: params.forceRegenerate,
      sourceHash,
      sourceImageUrl: analysis.originalImageUrl ?? analysis.optimizedImageUrl!,
    });

    // Cost preview: only non-cached outputs are billable.
    const nonCached = outputs.filter((o) => !o.cached).map((o) => o.outputType);
    const estimate = await this.billing.estimate(nonCached);
    return { outputs, estimate };
  }

  /**
   * Merchant confirm → product creation. Validates ownership, category
   * eligibility and compliance, charges once (idempotent), creates the product,
   * links the chosen image, and normalizes approved attributes into the EAV
   * layer. On any downstream failure the confirm charge is refunded.
   */
  async confirm(params: {
    userId: string;
    storeId: string;
    analysisId: string;
    dto: ConfirmCatalogDto;
    ipAddress?: string;
  }): Promise<{ productId: string; publish: boolean; charged: boolean; amountPaise: number }> {
    if (!(await this.config.isEnabled())) {
      throw new ServiceUnavailableException({ message: 'AI cataloging v2 is not enabled.', code: 'AI_CATALOG_DISABLED' });
    }
    const profile = await this.merchantService.requireMerchantProfile(params.userId);
    const analysis = await this.prisma.aIProductAnalysis.findFirst({
      where: { id: params.analysisId, merchantProfileId: profile.id, storeId: params.storeId },
      include: { imageAssets: true },
    });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.status === AIProductAnalysisStatus.CONFIRMED && analysis.createdProductId) {
      return { productId: analysis.createdProductId, publish: false, charged: false, amountPaise: 0 };
    }
    if (analysis.status !== AIProductAnalysisStatus.COMPLETED) {
      throw new BadRequestException(`Analysis must be completed before confirmation (is ${analysis.status})`);
    }

    const json = (analysis.extractedJson ?? {}) as Record<string, unknown>;
    const extracted = (json.attributes ?? null) as ExtractedAttributesV2 | null;
    if (!extracted) throw new BadRequestException('Analysis has no extracted attributes');

    // Category must be one the store is actually eligible for — never trust a
    // raw categoryId from the client.
    const eligible = await this.category.eligibleFlat(params.storeId, params.userId);
    if (!eligible.some((c) => c.id === params.dto.categoryId)) {
      throw new BadRequestException('Selected category is not available for this store');
    }

    // Compliance gate for flagged/supplement products.
    if (extracted.isSupplement && !params.dto.complianceConfirmed) {
      throw new BadRequestException('Please confirm you have verified supplement/regulatory details.');
    }
    const minConfidence = await this.config.publishMinConfidence();
    if (params.dto.publish && (analysis.confidence ?? 0) < minConfidence) {
      throw new BadRequestException('Confidence too low to publish. Save as draft and review.');
    }

    // Resolve the chosen primary image (must belong to this analysis + be ready).
    let primaryImageUrl = analysis.optimizedImageUrl ?? analysis.uploadedImageUrl;
    if (params.dto.primaryImageAssetId) {
      const asset = analysis.imageAssets.find((a) => a.id === params.dto.primaryImageAssetId);
      if (!asset || !asset.imageUrl) throw new BadRequestException('Selected image is not available');
      primaryImageUrl = asset.imageUrl;
    }

    const charge = await this.billing.debitForConfirm({
      merchantProfileId: profile.id,
      storeId: params.storeId,
      analysisId: analysis.id,
      userId: params.userId,
      ipAddress: params.ipAddress,
    });

    try {
      const createDto: CreateProductDto = {
        name: params.dto.name,
        description: params.dto.description ?? extracted.shortDescription ?? undefined,
        brand: params.dto.brand ?? extracted.brand ?? undefined,
        sku: params.dto.sku ?? undefined,
        categoryId: params.dto.categoryId,
        imageUrls: [primaryImageUrl],
        basePrice: params.dto.basePrice,
        mrp: params.dto.mrp,
        unit: params.dto.unit ?? 'piece',
        quantity: params.dto.quantity ?? 0,
        tags: params.dto.tags ?? extracted.searchTags?.slice(0, 15),
        ingredients: extracted.ingredients ?? undefined,
        countryOfOrigin: extracted.countryOfOrigin ?? undefined,
        manufacturerName: extracted.manufacturerName ?? undefined,
      } as CreateProductDto;

      const product = await this.productService.createProduct(params.userId, params.storeId, createDto, params.ipAddress);
      if (!params.dto.publish) {
        await this.productService.updateStatus(params.userId, params.storeId, product.id, { isActive: false });
      }

      // Link generated assets + normalize approved attributes into the EAV layer.
      await this.prisma.aIProductImageAsset.updateMany({ where: { analysisId: analysis.id }, data: { productId: product.id } });
      await this.attributes.syncFromApproval({
        productId: product.id,
        analysisId: analysis.id,
        categoryId: params.dto.categoryId,
        extracted,
        approvals: (params.dto.attributes ?? []).map((a) => ({ key: a.key, approved: a.approved, value: a.value, unitKey: a.unitKey })),
        actorId: params.userId,
      });

      await this.prisma.aIProductAnalysis.update({
        where: { id: analysis.id },
        data: { status: AIProductAnalysisStatus.CONFIRMED, createdProductId: product.id, chargedAt: new Date() },
      });

      await this.audit.log({
        actorId: params.userId,
        action: 'AI_CATALOG_CONFIRMED',
        resourceType: 'AIProductAnalysis',
        resourceId: analysis.id,
        ipAddress: params.ipAddress,
        metadata: { productId: product.id, publish: Boolean(params.dto.publish), chargedPaise: charge.amountPaise },
      });

      return { productId: product.id, publish: Boolean(params.dto.publish), charged: charge.charged, amountPaise: charge.amountPaise };
    } catch (e) {
      await this.billing.refundConfirm({ merchantProfileId: profile.id, analysisId: analysis.id, reason: (e as Error).message, userId: params.userId });
      throw e;
    }
  }

  async getJobStatus(userId: string, jobLedgerId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const job = await this.prisma.aIProductJob.findUnique({ where: { id: jobLedgerId } });
    if (!job || job.merchantProfileId !== profile.id) throw new NotFoundException('Job not found');
    return {
      jobId: job.id,
      jobType: job.jobType,
      status: job.status,
      progress: job.progress,
      analysisId: job.analysisId,
      imageAssetId: job.imageAssetId,
      errorMessage: job.errorMessage,
      retryable: job.status === AIProductJobStatus.FAILED && job.attempts < job.maxAttempts,
      updatedAt: job.updatedAt,
    };
  }

  // ── guards / limits ───────────────────────────────────────────────────────────
  private async assertStoreOwnership(merchantProfileId: string, storeId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, merchantProfileId, deletedAt: null }, select: { id: true } });
    if (!store) throw new ForbiddenException('Store not found or not owned by you');
  }

  private async enforceRateLimit(merchantProfileId: string): Promise<void> {
    const key = `ai-catalog:rl:analysis:${merchantProfileId}:${Math.floor(Date.now() / 60_000)}`;
    const count = await this.redis.getClient().incr(key);
    if (count === 1) await this.redis.getClient().expire(key, 60);
    if (count > RATE_LIMIT.ANALYSES_PER_MINUTE) {
      throw new BadRequestException('Too many analyses this minute. Please slow down.');
    }
  }

  private async enforceDailyLimit(merchantProfileId: string): Promise<void> {
    const limit = await this.config.dailyAnalysisLimit();
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const count = await this.prisma.aIProductAnalysis.count({ where: { merchantProfileId, createdAt: { gte: since } } });
    if (count >= limit) throw new BadRequestException(`Daily analysis limit (${limit}) reached.`);
  }

  private mapProductType(extracted: ExtractedAttributesV2): AIProductType {
    if (extracted.isSupplement) return AIProductType.SUPPLEMENT;
    const t = (extracted.productType ?? '').toUpperCase();
    const map: Record<string, AIProductType> = {
      PACKAGED_PRODUCT: AIProductType.PACKAGED_PRODUCT,
      FRESH_FOOD: AIProductType.FRESH_FOOD,
      RESTAURANT_FOOD: AIProductType.RESTAURANT_FOOD,
      ELECTRONICS: AIProductType.ELECTRONICS,
      BEAUTY: AIProductType.BEAUTY,
      PET: AIProductType.PET,
      FLOWERS: AIProductType.FLOWERS,
    };
    return map[t] ?? AIProductType.UNKNOWN;
  }
}
