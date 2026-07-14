import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AI_QUEUE, WORKER_CONCURRENCY, WORKER_LIVENESS } from '../ai-catalog.constants';
import { backoffStrategy } from './backoff.util';
import { AiCatalogImageService } from '../services/ai-catalog-image.service';
import { AiCatalogJobLifecycleService } from './job-lifecycle.service';
import type { ImageJobPayload } from '../ai-catalog.types';

@Processor(AI_QUEUE.IMAGE, {
  concurrency: WORKER_CONCURRENCY.IMAGE,
  settings: { backoffStrategy },
  stalledInterval: WORKER_LIVENESS.stalledIntervalMs,
  maxStalledCount: WORKER_LIVENESS.maxStalledCount,
  lockDuration: WORKER_LIVENESS.lockDurationMs,
})
export class ImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessor.name);

  constructor(
    private readonly images: AiCatalogImageService,
    private readonly lifecycle: AiCatalogJobLifecycleService,
  ) {
    super();
  }

  async process(job: Job<ImageJobPayload>): Promise<void> {
    await this.images.process(job.data);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<ImageJobPayload>): void {
    void this.lifecycle.onActive(job);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ImageJobPayload> | undefined, err: Error): void {
    void this.lifecycle.onFailed(job, err);
  }
}
