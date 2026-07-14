import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AIProductJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AiCatalogImageService } from '../services/ai-catalog-image.service';
import { AiCatalogProgressService } from '../services/ai-catalog-progress.service';
import { AI_QUEUE } from '../ai-catalog.constants';
import type { AnyJobPayload, ImageJobPayload } from '../ai-catalog.types';

/**
 * Shared BullMQ lifecycle bookkeeping for all AI processors: mirror active/
 * failed transitions onto the durable AIProductJob ledger, decide when a job is
 * dead-lettered (retries exhausted) vs still-retrying, and run terminal
 * compensation (refund a paid image whose render irrecoverably failed).
 */
@Injectable()
export class AiCatalogJobLifecycleService {
  private readonly logger = new Logger(AiCatalogJobLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: AiCatalogImageService,
    private readonly progress: AiCatalogProgressService,
  ) {}

  async onActive(job: Job<AnyJobPayload>): Promise<void> {
    const ledgerId = job.data.jobLedgerId;
    if (!ledgerId) return;
    await this.prisma.aIProductJob
      .update({
        where: { id: ledgerId },
        data: { status: AIProductJobStatus.ACTIVE, attempts: job.attemptsMade + 1, startedAt: new Date() },
      })
      .catch(() => undefined);
  }

  async onFailed(job: Job<AnyJobPayload> | undefined, err: Error): Promise<void> {
    if (!job?.data?.jobLedgerId) return;
    const ledgerId = job.data.jobLedgerId;
    const maxAttempts = job.opts.attempts ?? 1;
    const exhausted = job.attemptsMade >= maxAttempts;
    const message = err.message?.slice(0, 1000) ?? 'Unknown error';

    await this.prisma.aIProductJob
      .update({
        where: { id: ledgerId },
        data: {
          status: exhausted ? AIProductJobStatus.FAILED : AIProductJobStatus.RETRYING,
          attempts: job.attemptsMade,
          errorMessage: message,
          ...(exhausted && { finishedAt: new Date() }),
        },
      })
      .catch(() => undefined);

    await this.progress.publish({
      jobId: ledgerId,
      merchantProfileId: (job.data as { merchantProfileId?: string }).merchantProfileId ?? '',
      analysisId: (job.data as { analysisId?: string }).analysisId,
      imageAssetId: (job.data as { imageAssetId?: string }).imageAssetId,
      stage: 'failed',
      progress: 0,
      status: exhausted ? 'FAILED' : 'RETRYING',
      message,
      retryable: !exhausted,
    });

    // Dead-letter compensation: a paid image that irrecoverably failed is
    // refunded and marked FAILED so the merchant is never charged for nothing.
    if (exhausted && job.queueName === AI_QUEUE.IMAGE) {
      await this.imageService
        .onIrrecoverableFailure(job.data as ImageJobPayload, message)
        .catch((e) => this.logger.error(`Refund/compensation failed for ${ledgerId}: ${(e as Error).message}`));
    }

    this.logger.warn(
      `Job ${ledgerId} (${job.queueName}) ${exhausted ? 'DEAD-LETTERED' : 'will retry'} after attempt ${job.attemptsMade}: ${message}`,
    );
  }

  async recordResult(ledgerId: string, result: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.aIProductJob
      .update({ where: { id: ledgerId }, data: { result } })
      .catch(() => undefined);
  }
}
