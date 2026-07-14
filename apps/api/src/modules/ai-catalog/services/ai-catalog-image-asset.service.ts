import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { AIProductImageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import { ImageOutputType, SYNTHETIC_GEOMETRY_OUTPUTS } from '../ai-catalog.constants';
import type { SavedAsset } from './ai-catalog-image-processing.service';
import type { ImageGenerationResult } from '../providers/ai-provider.interface';

export interface PreparedAsset {
  assetId: string;
  cached: boolean;
  outputType: ImageOutputType;
  transparent: boolean;
  version: number;
}

/**
 * Owns the versioned + cached image-asset catalog. The cache key is
 * sha256(sourceHash | outputType | model | promptVersion | size/params). An
 * identical request resolves to the existing GENERATED asset (no re-render, no
 * charge). A forced regeneration mixes in a nonce so it produces a NEW version
 * and never deletes or supersedes prior approved versions.
 */
@Injectable()
export class AiCatalogImageAssetService {
  private readonly logger = new Logger(AiCatalogImageAssetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AiCatalogConfigService,
  ) {}

  computeCacheKey(input: {
    sourceHash: string;
    outputType: string;
    model: string;
    promptVersion: number;
    transparent: boolean;
    nonce?: string;
  }): string {
    return createHash('sha256')
      .update(
        [input.sourceHash, input.outputType, input.model, `pv${input.promptVersion}`, input.transparent ? 't' : 'o', input.nonce ?? '']
          .join('|'),
      )
      .digest('hex');
  }

  /**
   * Resolve an image request to either a cache hit or a fresh QUEUED asset row.
   * Returns cached:true when an identical, already-GENERATED asset exists and
   * regeneration was not forced.
   */
  async prepare(params: {
    analysisId: string;
    merchantProfileId: string;
    storeId: string;
    sourceHash: string;
    sourceImageUrl: string;
    outputType: ImageOutputType;
    forceRegenerate: boolean;
  }): Promise<PreparedAsset> {
    const model = await this.config.imageModel();
    const promptVersion = (await this.config.activePrompt(`image:${params.outputType}`))?.version ?? 1;
    const transparent = params.outputType === 'transparent_png';

    const baseKey = this.computeCacheKey({
      sourceHash: params.sourceHash,
      outputType: params.outputType,
      model,
      promptVersion,
      transparent,
    });

    if (!params.forceRegenerate) {
      const hit = await this.prisma.aIProductImageAsset.findUnique({ where: { cacheKey: baseKey } });
      if (hit && hit.status === AIProductImageStatus.GENERATED) {
        return { assetId: hit.id, cached: true, outputType: params.outputType, transparent, version: hit.version };
      }
    }

    // New version = one above the highest existing version for this output.
    const latest = await this.prisma.aIProductImageAsset.findFirst({
      where: { analysisId: params.analysisId, outputType: params.outputType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const cacheKey = params.forceRegenerate
      ? this.computeCacheKey({ sourceHash: params.sourceHash, outputType: params.outputType, model, promptVersion, transparent, nonce: `v${version}` })
      : baseKey;

    const asset = await this.prisma.aIProductImageAsset.create({
      data: {
        analysisId: params.analysisId,
        merchantProfileId: params.merchantProfileId,
        storeId: params.storeId,
        outputType: params.outputType,
        version,
        status: AIProductImageStatus.QUEUED,
        transparent,
        sourceImageUrl: params.sourceImageUrl,
        cacheKey,
        model,
        metadata: {
          promptVersion,
          syntheticGeometry: SYNTHETIC_GEOMETRY_OUTPUTS.has(params.outputType),
        } as Prisma.InputJsonValue,
      },
      select: { id: true, version: true },
    });
    return { assetId: asset.id, cached: false, outputType: params.outputType, transparent, version: asset.version };
  }

  async markGenerating(assetId: string, jobId: string): Promise<void> {
    await this.prisma.aIProductImageAsset.update({
      where: { id: assetId },
      data: { status: AIProductImageStatus.GENERATING, jobId },
    });
  }

  async finalize(assetId: string, saved: SavedAsset, gen: ImageGenerationResult): Promise<void> {
    await this.prisma.aIProductImageAsset.update({
      where: { id: assetId },
      data: {
        status: AIProductImageStatus.GENERATED,
        imageUrl: saved.imageUrl,
        thumbnailUrl: saved.thumbnailUrl,
        width: saved.width,
        height: saved.height,
        fileSizeBytes: saved.fileSizeBytes,
        format: saved.format,
        provider: gen.provider,
        model: gen.model,
        prompt: gen.prompt,
        negativePrompt: gen.negativePrompt,
        generationCostPaise: gen.costPaise,
        generationTimeMs: gen.generationTimeMs,
      },
    });
  }

  async fail(assetId: string, message: string): Promise<void> {
    await this.prisma.aIProductImageAsset.update({
      where: { id: assetId },
      data: { status: AIProductImageStatus.FAILED, errorMessage: message.slice(0, 1000) },
    });
  }

  async get(assetId: string): Promise<Prisma.AIProductImageAssetGetPayload<object> | null> {
    return this.prisma.aIProductImageAsset.findUnique({ where: { id: assetId } });
  }

  /** Latest asset per output type for an analysis (merchant gallery view). */
  async listForAnalysis(analysisId: string): Promise<Prisma.AIProductImageAssetGetPayload<object>[]> {
    return this.prisma.aIProductImageAsset.findMany({
      where: { analysisId },
      orderBy: [{ outputType: 'asc' }, { version: 'desc' }],
    });
  }
}
