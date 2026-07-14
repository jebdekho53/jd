import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AIProductJobStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AiCatalogQueueService } from '../queue/ai-catalog-queue.service';
import { AiCatalogJobLifecycleService } from './job-lifecycle.service';
import { AI_QUEUE, WORKER_CONCURRENCY, WORKER_LIVENESS } from '../ai-catalog.constants';
import { backoffStrategy } from './backoff.util';
import type { RetryJobPayload } from '../ai-catalog.types';

/**
 * Explicit re-drive queue for dead-lettered jobs (admin "retry" action). It
 * resets the ledger row and re-adds the original payload to its source queue.
 * This is deliberately separate from BullMQ's automatic attempt-based retries:
 * those are bounded (dead-letter after N), this is an operator escape hatch.
 */
@Processor(AI_QUEUE.RETRY, {
  concurrency: WORKER_CONCURRENCY.RETRY,
  settings: { backoffStrategy },
  stalledInterval: WORKER_LIVENESS.stalledIntervalMs,
  maxStalledCount: WORKER_LIVENESS.maxStalledCount,
  lockDuration: WORKER_LIVENESS.lockDurationMs,
})
export class RetryProcessor extends WorkerHost {
  private readonly logger = new Logger(RetryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: AiCatalogQueueService,
    private readonly lifecycle: AiCatalogJobLifecycleService,
  ) {
    super();
  }

  async process(job: Job<RetryJobPayload>): Promise<void> {
    const { jobLedgerId, originalQueue, originalPayload } = job.data;
    await this.prisma.aIProductJob.update({
      where: { id: jobLedgerId },
      data: { status: AIProductJobStatus.QUEUED, progress: 0, errorMessage: null, nextRetryAt: null },
    });
    await this.queue.redrive(originalQueue, originalPayload, jobLedgerId);
    this.logger.log(`Re-drove ledger ${jobLedgerId} onto ${originalQueue}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<RetryJobPayload> | undefined, err: Error): void {
    void this.lifecycle.onFailed(job, err);
  }
}
