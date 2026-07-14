import { Injectable, Logger } from '@nestjs/common';
import { AIProductJobStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../redis/redis.service';

export const AI_PROGRESS_CHANNEL = 'ai-catalog:progress';

/**
 * The realtime + durable progress contract. The DATABASE (AIProductJob) is the
 * source of truth — every update is persisted first — and Redis pub/sub is a
 * best-effort transport so the merchant's browser can show live progress. The
 * worker process runs separately from the API/gateway, so events are published
 * to a Redis channel that the gateway (in the API process) re-broadcasts into
 * the authenticated per-merchant room. A dropped WS message is harmless: the UI
 * re-fetches job state on reconnect.
 */
export interface ProgressEvent {
  jobId: string;
  analysisId?: string | null;
  imageAssetId?: string | null;
  merchantProfileId: string;
  stage: string;
  progress: number;
  status: string;
  message?: string;
  outputType?: string;
  retryable?: boolean;
  updatedAt: string;
}

@Injectable()
export class AiCatalogProgressService {
  private readonly logger = new Logger(AiCatalogProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async publish(event: Omit<ProgressEvent, 'updatedAt'>): Promise<void> {
    const payload: ProgressEvent = { ...event, updatedAt: new Date().toISOString() };
    try {
      await this.redis.getClient().publish(AI_PROGRESS_CHANNEL, JSON.stringify(payload));
    } catch (e) {
      // Transport failure must never fail the job — DB remains source of truth.
      this.logger.warn(`Progress publish failed: ${(e as Error).message}`);
    }
  }

  /** Persist progress on the ledger row and emit a realtime event. */
  async update(params: {
    jobLedgerId: string;
    merchantProfileId: string;
    analysisId?: string | null;
    imageAssetId?: string | null;
    stage: string;
    progress: number;
    status: AIProductJobStatus;
    message?: string;
    outputType?: string;
    retryable?: boolean;
  }): Promise<void> {
    const progress = Math.max(0, Math.min(100, Math.round(params.progress)));
    await this.prisma.aIProductJob.update({
      where: { id: params.jobLedgerId },
      data: {
        progress,
        status: params.status,
        ...(params.status === AIProductJobStatus.ACTIVE && { startedAt: new Date() }),
      },
    });
    await this.publish({
      jobId: params.jobLedgerId,
      analysisId: params.analysisId,
      imageAssetId: params.imageAssetId,
      merchantProfileId: params.merchantProfileId,
      stage: params.stage,
      progress,
      status: params.status,
      message: params.message,
      outputType: params.outputType,
      retryable: params.retryable,
    });
  }
}
