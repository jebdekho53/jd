import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AIProductJobStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AiCatalogProgressService } from '../services/ai-catalog-progress.service';
import { AiCatalogJobLifecycleService } from './job-lifecycle.service';
import { AI_QUEUE, WORKER_CONCURRENCY, WORKER_LIVENESS } from '../ai-catalog.constants';
import { backoffStrategy } from './backoff.util';
import type { ModerationJobPayload } from '../ai-catalog.types';

/**
 * Moderation is human-in-the-loop: this processor only parks the flagged
 * analysis in a MODERATION_PENDING state and notifies the merchant that it is
 * under review. An admin resolves it via the admin API (approve/reject), which
 * is the actual decision point — no automated publish happens here.
 */
@Processor(AI_QUEUE.MODERATION, {
  concurrency: WORKER_CONCURRENCY.MODERATION,
  settings: { backoffStrategy },
  stalledInterval: WORKER_LIVENESS.stalledIntervalMs,
  maxStalledCount: WORKER_LIVENESS.maxStalledCount,
  lockDuration: WORKER_LIVENESS.lockDurationMs,
})
export class ModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ModerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: AiCatalogProgressService,
    private readonly lifecycle: AiCatalogJobLifecycleService,
  ) {
    super();
  }

  async process(job: Job<ModerationJobPayload>): Promise<void> {
    await this.prisma.aIProductJob.update({
      where: { id: job.data.jobLedgerId },
      data: { status: AIProductJobStatus.MODERATION_PENDING, moderationStatus: 'PENDING' },
    });
    await this.progress.publish({
      jobId: job.data.jobLedgerId,
      analysisId: job.data.analysisId,
      merchantProfileId: job.data.merchantProfileId,
      stage: 'moderation',
      progress: 100,
      status: 'MODERATION_PENDING',
      message: 'Sent to our team for a quick review',
    });
  }

  @OnWorkerEvent('active')
  onActive(job: Job<ModerationJobPayload>): void {
    void this.lifecycle.onActive(job);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ModerationJobPayload> | undefined, err: Error): void {
    void this.lifecycle.onFailed(job, err);
  }
}
