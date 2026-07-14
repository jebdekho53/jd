import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AIProductJobStatus, AIProductJobType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AI_QUEUE, AI_JOB, AI_JOB_DEFAULTS } from '../ai-catalog.constants';
import {
  AnalysisJobPayload,
  ImageJobPayload,
  ModerationJobPayload,
  PAYLOAD_SCHEMA_VERSION,
  RetryJobPayload,
} from '../ai-catalog.types';

/**
 * Single choke-point for enqueuing AI pipeline work. Every enqueue writes a
 * durable AIProductJob ledger row (idempotency-keyed) BEFORE pushing to
 * BullMQ, so the admin monitor and retry logic survive a Redis flush and
 * duplicate enqueues collapse to one job.
 */
@Injectable()
export class AiCatalogQueueService {
  private readonly logger = new Logger(AiCatalogQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(AI_QUEUE.ANALYSIS) private readonly analysisQueue: Queue,
    @InjectQueue(AI_QUEUE.IMAGE) private readonly imageQueue: Queue,
    @InjectQueue(AI_QUEUE.RETRY) private readonly retryQueue: Queue,
    @InjectQueue(AI_QUEUE.MODERATION) private readonly moderationQueue: Queue,
  ) {}

  // ── Analysis ───────────────────────────────────────────────────────────────
  async enqueueAnalysis(params: {
    analysisId: string;
    merchantProfileId: string;
    storeId: string;
    userId: string;
    ipAddress?: string;
    autoGenerateImages: boolean;
    priority?: number;
  }): Promise<{ jobLedgerId: string; deduped: boolean }> {
    const idempotencyKey = `analysis:${params.analysisId}`;
    const ledger = await this.upsertLedger({
      idempotencyKey,
      jobType: AIProductJobType.ANALYSIS,
      queueName: AI_QUEUE.ANALYSIS,
      analysisId: params.analysisId,
      merchantProfileId: params.merchantProfileId,
      storeId: params.storeId,
      priority: params.priority ?? 0,
    });
    if (ledger.deduped) return ledger;

    const payload: AnalysisJobPayload = {
      schemaVersion: PAYLOAD_SCHEMA_VERSION,
      jobLedgerId: ledger.jobLedgerId,
      analysisId: params.analysisId,
      merchantProfileId: params.merchantProfileId,
      storeId: params.storeId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      autoGenerateImages: params.autoGenerateImages,
    };
    await this.push(this.analysisQueue, AI_JOB.ANALYZE_IMAGE, payload, ledger.jobLedgerId, {
      priority: params.priority,
    });
    return ledger;
  }

  // ── Image generation ─────────────────────────────────────────────────────────
  async enqueueImage(params: {
    imageAssetId: string;
    analysisId: string;
    merchantProfileId: string;
    storeId: string;
    userId: string;
    ipAddress?: string;
    outputType: string;
    forceRegenerate: boolean;
    priority?: number;
  }): Promise<{ jobLedgerId: string; deduped: boolean }> {
    const idempotencyKey = `image:${params.imageAssetId}`;
    const ledger = await this.upsertLedger({
      idempotencyKey,
      jobType: AIProductJobType.IMAGE_GENERATION,
      queueName: AI_QUEUE.IMAGE,
      analysisId: params.analysisId,
      imageAssetId: params.imageAssetId,
      merchantProfileId: params.merchantProfileId,
      storeId: params.storeId,
      priority: params.priority ?? 0,
    });
    if (ledger.deduped) return ledger;

    const payload: ImageJobPayload = {
      schemaVersion: PAYLOAD_SCHEMA_VERSION,
      jobLedgerId: ledger.jobLedgerId,
      imageAssetId: params.imageAssetId,
      analysisId: params.analysisId,
      merchantProfileId: params.merchantProfileId,
      storeId: params.storeId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      outputType: params.outputType,
      forceRegenerate: params.forceRegenerate,
    };
    await this.push(this.imageQueue, AI_JOB.GENERATE_IMAGE, payload, ledger.jobLedgerId, {
      priority: params.priority,
    });
    return ledger;
  }

  // ── Moderation ───────────────────────────────────────────────────────────────
  async enqueueModeration(params: {
    analysisId: string;
    merchantProfileId: string;
    storeId: string;
    userId: string;
  }): Promise<{ jobLedgerId: string; deduped: boolean }> {
    const idempotencyKey = `moderation:${params.analysisId}`;
    const ledger = await this.upsertLedger({
      idempotencyKey,
      jobType: AIProductJobType.MODERATION,
      queueName: AI_QUEUE.MODERATION,
      analysisId: params.analysisId,
      merchantProfileId: params.merchantProfileId,
      storeId: params.storeId,
    });
    if (ledger.deduped) return ledger;

    const payload: ModerationJobPayload = {
      schemaVersion: PAYLOAD_SCHEMA_VERSION,
      jobLedgerId: ledger.jobLedgerId,
      analysisId: params.analysisId,
      merchantProfileId: params.merchantProfileId,
      storeId: params.storeId,
      userId: params.userId,
    };
    await this.push(this.moderationQueue, AI_JOB.MODERATE, payload, ledger.jobLedgerId);
    return ledger;
  }

  // ── Retry (dead-letter re-drive) ─────────────────────────────────────────────
  async enqueueRetry(params: {
    jobLedgerId: string;
    originalQueue: string;
    originalPayload: AnalysisJobPayload | ImageJobPayload;
    delayMs?: number;
  }): Promise<void> {
    const payload: RetryJobPayload = {
      schemaVersion: PAYLOAD_SCHEMA_VERSION,
      jobLedgerId: params.jobLedgerId,
      originalQueue: params.originalQueue,
      originalPayload: params.originalPayload,
    };
    await this.retryQueue.add(AI_JOB.RETRY_JOB, payload, {
      ...AI_JOB_DEFAULTS,
      delay: params.delayMs ?? 30_000,
      jobId: `retry:${params.jobLedgerId}:${Date.now()}`,
    });
    await this.prisma.aIProductJob.update({
      where: { id: params.jobLedgerId },
      data: {
        status: AIProductJobStatus.RETRYING,
        nextRetryAt: new Date(Date.now() + (params.delayMs ?? 30_000)),
      },
    });
  }

  /** Re-add an original payload onto its source queue (operator re-drive). */
  async redrive(
    originalQueue: string,
    originalPayload: AnalysisJobPayload | ImageJobPayload,
    jobLedgerId: string,
  ): Promise<void> {
    const queue = this.queueByName(originalQueue);
    const jobName =
      originalQueue === AI_QUEUE.IMAGE ? AI_JOB.GENERATE_IMAGE : AI_JOB.ANALYZE_IMAGE;
    const job = await queue.add(jobName, originalPayload as unknown as Prisma.InputJsonValue, {
      ...AI_JOB_DEFAULTS,
      jobId: `${jobLedgerId}:redrive:${Date.now()}`,
    });
    await this.prisma.aIProductJob.update({
      where: { id: jobLedgerId },
      data: { bullJobId: String(job.id), status: AIProductJobStatus.QUEUED },
    });
  }

  /** Resolve the concrete Queue by name (used by the re-drive worker). */
  queueByName(name: string): Queue {
    switch (name) {
      case AI_QUEUE.ANALYSIS:
        return this.analysisQueue;
      case AI_QUEUE.IMAGE:
        return this.imageQueue;
      case AI_QUEUE.MODERATION:
        return this.moderationQueue;
      default:
        return this.retryQueue;
    }
  }

  /** Aggregate live queue counts for the admin monitor. */
  async countsByQueue(): Promise<Record<string, Record<string, number>>> {
    const out: Record<string, Record<string, number>> = {};
    for (const q of [this.analysisQueue, this.imageQueue, this.retryQueue, this.moderationQueue]) {
      out[q.name] = await q.getJobCounts('active', 'waiting', 'delayed', 'completed', 'failed', 'paused');
    }
    return out;
  }

  // ── internals ────────────────────────────────────────────────────────────────
  private async upsertLedger(input: {
    idempotencyKey: string;
    jobType: AIProductJobType;
    queueName: string;
    analysisId?: string;
    imageAssetId?: string;
    merchantProfileId: string;
    storeId?: string;
    priority?: number;
  }): Promise<{ jobLedgerId: string; deduped: boolean }> {
    // A ledger row already in a non-terminal state means someone else enqueued
    // the same unit of work — collapse to it rather than double-charging/double-
    // processing. A terminal row (FAILED/CANCELLED) is allowed to be re-driven.
    const existing = await this.prisma.aIProductJob.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, status: true },
    });
    if (existing) {
      const terminal: AIProductJobStatus[] = [
        AIProductJobStatus.FAILED,
        AIProductJobStatus.CANCELLED,
        AIProductJobStatus.MODERATION_REJECTED,
      ];
      if (!terminal.includes(existing.status)) {
        return { jobLedgerId: existing.id, deduped: true };
      }
      await this.prisma.aIProductJob.update({
        where: { id: existing.id },
        data: { status: AIProductJobStatus.QUEUED, progress: 0, errorMessage: null },
      });
      return { jobLedgerId: existing.id, deduped: false };
    }

    const created = await this.prisma.aIProductJob.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        jobType: input.jobType,
        queueName: input.queueName,
        analysisId: input.analysisId,
        imageAssetId: input.imageAssetId,
        merchantProfileId: input.merchantProfileId,
        storeId: input.storeId,
        priority: input.priority ?? 0,
        maxAttempts: AI_JOB_DEFAULTS.attempts,
        status: AIProductJobStatus.QUEUED,
      },
      select: { id: true },
    });
    return { jobLedgerId: created.id, deduped: false };
  }

  private async push(
    queue: Queue,
    jobName: string,
    payload: object,
    jobLedgerId: string,
    opts: { priority?: number } = {},
  ): Promise<void> {
    const job = await queue.add(jobName, payload as Prisma.InputJsonValue, {
      ...AI_JOB_DEFAULTS,
      priority: opts.priority,
      // Stable jobId so a re-enqueue for the same ledger row is a no-op in Redis.
      jobId: jobLedgerId,
    });
    // Persist the payload on the ledger so an operator re-drive can reconstruct
    // the exact job even after the Redis entry is evicted.
    await this.prisma.aIProductJob.update({
      where: { id: jobLedgerId },
      data: { bullJobId: String(job.id), payload: payload as Prisma.InputJsonValue },
    });
    this.logger.debug(`Enqueued ${jobName} on ${queue.name} (ledger=${jobLedgerId}, bull=${job.id})`);
  }
}
