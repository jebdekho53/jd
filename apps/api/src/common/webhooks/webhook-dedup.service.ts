import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { WebhookEventStatus, WebhookProvider } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type WebhookClaimResult =
  | { action: 'process'; recordId: string }
  | { action: 'duplicate' }
  | { action: 'retry'; recordId: string };

@Injectable()
export class WebhookDedupService {
  private readonly logger = new Logger(WebhookDedupService.name);

  constructor(private readonly prisma: PrismaService) {}

  hashPayload(rawBody: Buffer): string {
    return createHash('sha256').update(rawBody).digest('hex');
  }

  /**
   * Claim a webhook event for processing. Rejects duplicates atomically.
   * When eventId is missing, derives a stable id from payload hash + provider.
   */
  async claimEvent(
    provider: WebhookProvider,
    eventId: string | null | undefined,
    rawBody: Buffer,
    signature?: string,
  ): Promise<WebhookClaimResult> {
    const payloadHash = this.hashPayload(rawBody);
    const resolvedEventId = eventId?.trim() || `${payloadHash.slice(0, 32)}`;

    try {
      const record = await this.prisma.webhookEvent.create({
        data: {
          provider,
          eventId: resolvedEventId,
          signature,
          payloadHash,
          status: WebhookEventStatus.RECEIVED,
        },
      });
      return { action: 'process', recordId: record.id };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== 'P2002') throw err;

      const existing = await this.prisma.webhookEvent.findUnique({
        where: { provider_eventId: { provider, eventId: resolvedEventId } },
      });
      if (!existing) return { action: 'duplicate' };

      if (
        existing.status === WebhookEventStatus.FAILED ||
        existing.status === WebhookEventStatus.RECEIVED
      ) {
        await this.prisma.webhookEvent.update({
          where: { id: existing.id },
          data: { status: WebhookEventStatus.RECEIVED, errorMessage: null },
        });
        return { action: 'retry', recordId: existing.id };
      }

      this.logger.debug({ provider, eventId: resolvedEventId }, 'Duplicate webhook ignored');
      return { action: 'duplicate' };
    }
  }

  async markProcessed(recordId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: recordId },
      data: { status: WebhookEventStatus.PROCESSED, processedAt: new Date() },
    });
  }

  async markFailed(recordId: string, error: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: recordId },
      data: {
        status: WebhookEventStatus.FAILED,
        errorMessage: error.slice(0, 2000),
        processedAt: new Date(),
      },
    });
  }

  async markDuplicate(recordId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: recordId },
      data: { status: WebhookEventStatus.DUPLICATE, processedAt: new Date() },
    });
  }
}
