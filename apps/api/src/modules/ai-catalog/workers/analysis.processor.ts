import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AI_QUEUE, WORKER_CONCURRENCY, WORKER_LIVENESS } from '../ai-catalog.constants';
import { backoffStrategy } from './backoff.util';
import { AiCatalogAnalysisService } from '../services/ai-catalog-analysis.service';
import { AiCatalogJobLifecycleService } from './job-lifecycle.service';
import type { AnalysisJobPayload } from '../ai-catalog.types';

@Processor(AI_QUEUE.ANALYSIS, {
  concurrency: WORKER_CONCURRENCY.ANALYSIS,
  settings: { backoffStrategy },
  stalledInterval: WORKER_LIVENESS.stalledIntervalMs,
  maxStalledCount: WORKER_LIVENESS.maxStalledCount,
  lockDuration: WORKER_LIVENESS.lockDurationMs,
})
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private readonly analysis: AiCatalogAnalysisService,
    private readonly lifecycle: AiCatalogJobLifecycleService,
  ) {
    super();
  }

  async process(job: Job<AnalysisJobPayload>): Promise<void> {
    await this.analysis.process(job.data);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<AnalysisJobPayload>): void {
    void this.lifecycle.onActive(job);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<AnalysisJobPayload> | undefined, err: Error): void {
    void this.lifecycle.onFailed(job, err);
  }
}
