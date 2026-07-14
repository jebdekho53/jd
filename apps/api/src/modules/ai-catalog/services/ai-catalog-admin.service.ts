import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AIProductAnalysisStatus, AIProductJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import { AiCatalogQueueService } from '../queue/ai-catalog-queue.service';
import { AiCatalogBillingService } from './ai-catalog-billing.service';
import { AiCatalogAttributeRegistryService } from './ai-catalog-attribute-registry.service';
import type { AnalysisJobPayload } from '../ai-catalog.types';
import { PAYLOAD_SCHEMA_VERSION } from '../ai-catalog.types';

/** Admin surface: queue health, failed-job re-drive, moderation, config,
 *  versioned prompts, refunds and billing audit. */
@Injectable()
export class AiCatalogAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AiCatalogConfigService,
    private readonly queue: AiCatalogQueueService,
    private readonly billing: AiCatalogBillingService,
    private readonly registry: AiCatalogAttributeRegistryService,
  ) {}

  async queueHealth() {
    const [counts, failed, moderationPending] = await Promise.all([
      this.queue.countsByQueue(),
      this.prisma.aIProductJob.count({ where: { status: AIProductJobStatus.FAILED } }),
      this.prisma.aIProductJob.count({ where: { status: AIProductJobStatus.MODERATION_PENDING } }),
    ]);
    return { queues: counts, ledger: { failed, moderationPending } };
  }

  async listFailedJobs(page = 1, limit = 50) {
    const where = { status: AIProductJobStatus.FAILED };
    const [items, total] = await Promise.all([
      this.prisma.aIProductJob.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.aIProductJob.count({ where }),
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /** Operator re-drive of a dead-lettered job onto the retry queue. */
  async redriveJob(jobLedgerId: string, actorId: string): Promise<{ requeued: boolean }> {
    const job = await this.prisma.aIProductJob.findUnique({ where: { id: jobLedgerId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== AIProductJobStatus.FAILED) throw new BadRequestException('Only failed jobs can be re-driven');
    if (!job.payload) throw new BadRequestException('Job payload unavailable; cannot re-drive');
    const payload = job.payload as unknown as AnalysisJobPayload;
    await this.queue.enqueueRetry({
      jobLedgerId: job.id,
      originalQueue: job.queueName,
      originalPayload: { ...payload, schemaVersion: PAYLOAD_SCHEMA_VERSION, jobLedgerId: job.id },
      delayMs: 1_000,
    });
    await this.audit.log({ actorId, action: 'AI_CATALOG_JOB_REDRIVE', resourceType: 'AIProductJob', resourceId: job.id });
    return { requeued: true };
  }

  async listModeration(page = 1, limit = 50) {
    const where = { status: AIProductAnalysisStatus.MODERATION_HOLD };
    const [items, total] = await Promise.all([
      this.prisma.aIProductAnalysis.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, storeId: true, merchantProfileId: true, confidence: true, uploadedImageUrl: true, extractedJson: true, createdAt: true },
      }),
      this.prisma.aIProductAnalysis.count({ where }),
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async resolveModeration(analysisId: string, approve: boolean, reason: string | undefined, actorId: string) {
    const analysis = await this.prisma.aIProductAnalysis.findUnique({ where: { id: analysisId } });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.status !== AIProductAnalysisStatus.MODERATION_HOLD) {
      throw new BadRequestException('Analysis is not awaiting moderation');
    }
    await this.prisma.$transaction([
      this.prisma.aIProductAnalysis.update({
        where: { id: analysisId },
        data: { status: approve ? AIProductAnalysisStatus.COMPLETED : AIProductAnalysisStatus.FAILED, errorMessage: approve ? null : (reason ?? 'Rejected in moderation') },
      }),
      this.prisma.aIProductJob.updateMany({
        where: { analysisId, status: AIProductJobStatus.MODERATION_PENDING },
        data: {
          status: approve ? AIProductJobStatus.MODERATION_APPROVED : AIProductJobStatus.MODERATION_REJECTED,
          moderationStatus: approve ? 'APPROVED' : 'REJECTED',
          moderationReason: reason,
          moderatedById: actorId,
        },
      }),
    ]);
    await this.audit.log({
      actorId,
      action: approve ? 'AI_CATALOG_MODERATION_APPROVE' : 'AI_CATALOG_MODERATION_REJECT',
      resourceType: 'AIProductAnalysis',
      resourceId: analysisId,
      metadata: { reason } as Prisma.InputJsonValue,
    });
    return { resolved: true, approved: approve };
  }

  async getConfig() {
    return {
      enabled: await this.config.isEnabled(),
      pricing: await this.config.pricing(),
      disabledOutputs: [...(await this.config.disabledOutputs())],
      categoryAutoSelectThreshold: await this.config.categoryAutoSelectThreshold(),
      categoryAutoSelectMargin: await this.config.categoryAutoSelectMargin(),
      attributeAutoApproveThreshold: await this.config.attributeAutoApproveThreshold(),
      publishMinConfidence: await this.config.publishMinConfidence(),
      dailyAnalysisLimit: await this.config.dailyAnalysisLimit(),
      visionModel: await this.config.visionModel(),
      imageModel: await this.config.imageModel(),
      overrides: await this.config.allSettings(),
    };
  }

  async setConfig(key: string, value: unknown, actorId: string) {
    await this.config.setSetting(key, value, actorId);
    await this.audit.log({ actorId, action: 'AI_CATALOG_CONFIG_SET', resourceType: 'AICatalogSetting', resourceId: key, metadata: { value } as Prisma.InputJsonValue });
    return { updated: true };
  }

  /** Create + activate a new prompt version (prior versions retained + auditable). */
  async createPromptVersion(kind: string, content: string, notes: string | undefined, actorId: string) {
    const latest = await this.prisma.aICatalogPromptVersion.findFirst({ where: { kind }, orderBy: { version: 'desc' } });
    const version = (latest?.version ?? 0) + 1;
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.aICatalogPromptVersion.updateMany({ where: { kind, isActive: true }, data: { isActive: false } });
      return tx.aICatalogPromptVersion.create({ data: { kind, version, content, notes, isActive: true, createdById: actorId } });
    });
    await this.audit.log({ actorId, action: 'AI_CATALOG_PROMPT_VERSION', resourceType: 'AICatalogPromptVersion', resourceId: created.id, metadata: { kind, version } });
    return created;
  }

  async listPromptVersions(kind: string) {
    return this.prisma.aICatalogPromptVersion.findMany({ where: { kind }, orderBy: { version: 'desc' } });
  }

  async refund(merchantProfileId: string, imageAssetId: string, reason: string, actorId: string) {
    await this.billing.refundForImage({ merchantProfileId, imageAssetId, reason, userId: actorId });
    return { refunded: true };
  }

  async billingAudit(merchantProfileId: string, page = 1, limit = 50) {
    const where = { merchantProfileId };
    const [items, total] = await Promise.all([
      this.prisma.merchantAiWalletTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.merchantAiWalletTransaction.count({ where }),
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
