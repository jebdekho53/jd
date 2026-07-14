import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AIProductImageStatus, AIProductJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MerchantService } from '../../merchant/merchant.service';
import { AI_IMAGE_PROVIDER, AiImageProvider } from '../providers/ai-provider.interface';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import { AiCatalogImageProcessingService } from './ai-catalog-image-processing.service';
import { AiCatalogImageAssetService } from './ai-catalog-image-asset.service';
import { AiCatalogBillingService } from './ai-catalog-billing.service';
import { AiCatalogProgressService } from './ai-catalog-progress.service';
import { AiCatalogQueueService } from '../queue/ai-catalog-queue.service';
import { ALL_IMAGE_OUTPUTS, ImageOutputType } from '../ai-catalog.constants';
import type { ExtractedAttributesV2, ImageJobPayload } from '../ai-catalog.types';

export interface QueuedOutput {
  outputType: ImageOutputType;
  assetId: string;
  cached: boolean;
  version: number;
  jobLedgerId?: string;
  imageUrl?: string | null;
}

/**
 * Orchestrates image generation: cache resolution, enqueue, and the worker-side
 * render→save→charge lifecycle. Cache hits never re-render and never charge.
 * Fresh renders charge exactly once (idempotent by asset). A dead-lettered paid
 * render triggers a refund (see retry worker).
 */
@Injectable()
export class AiCatalogImageService {
  private readonly logger = new Logger(AiCatalogImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    @Inject(AI_IMAGE_PROVIDER) private readonly provider: AiImageProvider,
    private readonly config: AiCatalogConfigService,
    private readonly processing: AiCatalogImageProcessingService,
    private readonly assets: AiCatalogImageAssetService,
    private readonly billing: AiCatalogBillingService,
    private readonly progress: AiCatalogProgressService,
    private readonly queue: AiCatalogQueueService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Prepare + enqueue a set of outputs for an analysis. Returns per-output
   * status so the UI can show cache hits (free, already available) vs freshly
   * queued jobs. Ownership/enable checks are the caller's responsibility for
   * merchant-initiated calls; the analysis auto-fanout passes trusted context.
   */
  async queueOutputs(params: {
    analysisId: string;
    merchantProfileId: string;
    storeId: string;
    userId: string;
    ipAddress?: string;
    outputTypes: ImageOutputType[];
    forceRegenerate: boolean;
    sourceHash: string;
    sourceImageUrl: string;
  }): Promise<QueuedOutput[]> {
    const results: QueuedOutput[] = [];
    for (const outputType of params.outputTypes) {
      if (!ALL_IMAGE_OUTPUTS.includes(outputType)) continue;
      if (!(await this.config.isOutputEnabled(outputType))) continue;

      const prepared = await this.assets.prepare({
        analysisId: params.analysisId,
        merchantProfileId: params.merchantProfileId,
        storeId: params.storeId,
        sourceHash: params.sourceHash,
        sourceImageUrl: params.sourceImageUrl,
        outputType,
        forceRegenerate: params.forceRegenerate,
      });

      if (prepared.cached) {
        const asset = await this.assets.get(prepared.assetId);
        results.push({ outputType, assetId: prepared.assetId, cached: true, version: prepared.version, imageUrl: asset?.imageUrl });
        continue;
      }

      const { jobLedgerId } = await this.queue.enqueueImage({
        imageAssetId: prepared.assetId,
        analysisId: params.analysisId,
        merchantProfileId: params.merchantProfileId,
        storeId: params.storeId,
        userId: params.userId,
        ipAddress: params.ipAddress,
        outputType,
        forceRegenerate: params.forceRegenerate,
      });
      results.push({ outputType, assetId: prepared.assetId, cached: false, version: prepared.version, jobLedgerId });
    }
    return results;
  }

  // ── Worker side ───────────────────────────────────────────────────────────────
  async process(payload: ImageJobPayload): Promise<void> {
    const asset = await this.assets.get(payload.imageAssetId);
    if (!asset) throw new NotFoundException('Image asset not found');
    if (asset.status === AIProductImageStatus.GENERATED) {
      this.logger.debug(`Asset ${asset.id} already generated; skipping duplicate`);
      return;
    }

    const analysis = await this.prisma.aIProductAnalysis.findUnique({ where: { id: payload.analysisId } });
    if (!analysis) throw new NotFoundException('Analysis not found');
    const extracted = ((analysis.extractedJson as Record<string, unknown> | null)?.attributes ?? null) as ExtractedAttributesV2 | null;

    await this.assets.markGenerating(asset.id, payload.jobLedgerId);
    await this.progress.update({
      jobLedgerId: payload.jobLedgerId,
      merchantProfileId: payload.merchantProfileId,
      imageAssetId: asset.id,
      analysisId: payload.analysisId,
      stage: 'generating',
      progress: 30,
      status: AIProductJobStatus.ACTIVE,
      outputType: asset.outputType,
      message: `Generating ${asset.outputType}`,
    });

    const sourceBytes = await this.processing.loadStored(asset.sourceImageUrl!);
    const gen = await this.provider.generate({
      outputType: asset.outputType,
      sourceImage: sourceBytes,
      transparent: asset.transparent,
      context: {
        productName: extracted?.productName,
        brand: extracted?.brand,
        category: extracted?.category,
        color: extracted?.color,
        material: extracted?.material,
        packageType: extracted?.packageType,
      },
    });
    const saved = await this.processing.saveGeneratedAsset(gen.buffer, asset.outputType, asset.transparent);
    await this.assets.finalize(asset.id, saved, gen);

    // Charge only AFTER a successful render+persist. Idempotent by asset id.
    const charge = await this.billing.debitForImage({
      merchantProfileId: payload.merchantProfileId,
      storeId: payload.storeId,
      analysisId: payload.analysisId,
      imageAssetId: asset.id,
      outputType: asset.outputType,
      userId: payload.userId,
      ipAddress: payload.ipAddress,
    });

    await this.progress.update({
      jobLedgerId: payload.jobLedgerId,
      merchantProfileId: payload.merchantProfileId,
      imageAssetId: asset.id,
      analysisId: payload.analysisId,
      stage: 'ready',
      progress: 100,
      status: AIProductJobStatus.COMPLETED,
      outputType: asset.outputType,
      message: `${asset.outputType} ready`,
    });
    await this.prisma.aIProductJob.update({
      where: { id: payload.jobLedgerId },
      data: {
        status: AIProductJobStatus.COMPLETED,
        finishedAt: new Date(),
        result: { imageUrl: saved.imageUrl, chargedPaise: charge.amountPaise } as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      actorId: payload.userId,
      action: 'AI_CATALOG_IMAGE_GENERATED',
      resourceType: 'AIProductImageAsset',
      resourceId: asset.id,
      ipAddress: payload.ipAddress,
      metadata: { outputType: asset.outputType, chargedPaise: charge.amountPaise, timeMs: gen.generationTimeMs } as Prisma.InputJsonValue,
    });
  }

  /** Called by the retry/dead-letter handler when a paid render exhausts retries. */
  async onIrrecoverableFailure(payload: ImageJobPayload, reason: string): Promise<void> {
    await this.assets.fail(payload.imageAssetId, reason);
    // If a debit somehow landed for this asset, return it. No-op if never charged.
    await this.billing.refundForImage({
      merchantProfileId: payload.merchantProfileId,
      imageAssetId: payload.imageAssetId,
      reason,
    });
  }

  // ── Merchant asset actions ──────────────────────────────────────────────────────
  async approveAsset(userId: string, assetId: string, approve: boolean): Promise<void> {
    const asset = await this.assertOwnedAsset(userId, assetId);
    await this.prisma.aIProductImageAsset.update({
      where: { id: asset.id },
      data: {
        approvalStatus: approve ? 'APPROVED' : 'REJECTED',
        approvedByMerchant: approve,
        status: approve ? AIProductImageStatus.APPROVED : AIProductImageStatus.REJECTED,
      },
    });
  }

  async selectAsset(userId: string, assetId: string): Promise<void> {
    const asset = await this.assertOwnedAsset(userId, assetId);
    await this.prisma.$transaction([
      this.prisma.aIProductImageAsset.updateMany({
        where: { analysisId: asset.analysisId, isSelected: true },
        data: { isSelected: false },
      }),
      this.prisma.aIProductImageAsset.update({ where: { id: asset.id }, data: { isSelected: true } }),
    ]);
  }

  private async assertOwnedAsset(userId: string, assetId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const asset = await this.assets.get(assetId);
    if (!asset || asset.merchantProfileId !== profile.id) throw new ForbiddenException('Image asset not found');
    return asset;
  }
}
