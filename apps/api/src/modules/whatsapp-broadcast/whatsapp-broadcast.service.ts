import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  Prisma,
  WhatsAppBroadcastMode,
  WhatsAppBroadcastRecipientStatus,
  WhatsAppBroadcastStatus,
} from '@prisma/client';
import { getConfig } from '../../config/configuration';
import { envInt } from '../../config/env-int.util';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService, type WhatsAppSendResult } from '../auth/whatsapp.service';
import { WhatsAppInboxService } from '../whatsapp-inbox/whatsapp-inbox.service';
import { parseRecipientsCsv, renderTemplate } from './csv-recipients.util';
import { classifySendError } from './whatsapp-error-codes';
import {
  CreateWhatsAppBroadcastDto,
  ListWhatsAppBroadcastsQueryDto,
} from './dto/whatsapp-broadcast.dto';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

interface MetaTemplate {
  name: string;
  status: string;
  language: string;
  category: string;
  components?: Array<{ type: string; text?: string }>;
}

@Injectable()
export class WhatsAppBroadcastService {
  private readonly logger = new Logger(WhatsAppBroadcastService.name);
  private readonly cfg: ReturnType<typeof getConfig>;
  private readonly defaultRatePerSecond: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly whatsapp: WhatsAppService,
    private readonly inbox: WhatsAppInboxService,
  ) {
    this.cfg = getConfig(configService);
    this.defaultRatePerSecond = envInt(configService, 'WHATSAPP_BROADCAST_RATE_PER_SECOND', 10);
  }

  // ── Templates ────────────────────────────────────────────────────────────

  /**
   * Approved templates on the WABA, with the number of positional body
   * variables each one takes, so the UI can ask for exactly that many CSV
   * columns instead of making the operator remember the template's shape.
   */
  async listApprovedTemplates(): Promise<
    Array<{ name: string; language: string; category: string; bodyText: string; variableCount: number }>
  > {
    const wa = this.cfg.whatsapp;
    const accessToken = (this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '') ?? '').trim();
    if (!accessToken || !wa.businessAccountId) {
      throw new BadRequestException('WhatsApp business account is not configured');
    }

    const url = `https://graph.facebook.com/${wa.graphVersion}/${wa.businessAccountId}/message_templates`;
    try {
      const { data } = await axios.get<{ data?: MetaTemplate[] }>(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 100, fields: 'name,status,language,category,components' },
        timeout: 8000,
      });

      return (data.data ?? [])
        .filter((template) => template.status === 'APPROVED')
        .map((template) => {
          const body = template.components?.find((c) => c.type === 'BODY');
          const bodyText = body?.text ?? '';
          // Distinct {{1}}, {{2}}, … placeholders in the body.
          const variableCount = new Set(bodyText.match(/\{\{\s*\d+\s*\}\}/g) ?? []).size;
          return {
            name: template.name,
            language: template.language,
            category: template.category,
            bodyText,
            variableCount,
          };
        });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data?.error as { message?: string } | undefined)?.message ?? err.message)
        : 'Could not reach Meta';
      this.logger.warn({ err: message }, 'Could not list WhatsApp templates');
      throw new BadRequestException(`Could not load templates from Meta: ${message}`);
    }
  }

  // ── Create ───────────────────────────────────────────────────────────────

  /**
   * Parse the CSV, persist the broadcast and its recipients, then start sending
   * in the background. Returns immediately — the caller polls `findOne` for
   * progress. Bad CSV rows are reported up front rather than failing the upload.
   */
  async create(dto: CreateWhatsAppBroadcastDto, userId: string) {
    if (!this.cfg.whatsapp.phoneNumberId) {
      throw new BadRequestException('WhatsApp is not configured (WHATSAPP_PHONE_NUMBER_ID missing)');
    }

    let parsed: ReturnType<typeof parseRecipientsCsv>;
    try {
      parsed = parseRecipientsCsv(dto.csv);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Could not parse the CSV');
    }

    if (parsed.recipients.length === 0) {
      throw new BadRequestException('No usable rows in the CSV');
    }

    const templateParams = dto.templateParams ?? [];
    if (dto.mode === WhatsAppBroadcastMode.TEMPLATE) {
      const missing = templateParams.filter((col) => !parsed.headers.includes(col.toLowerCase()));
      if (missing.length) {
        throw new BadRequestException(
          `CSV has no column for template variable(s): ${missing.join(', ')}`,
        );
      }
    }

    const broadcast = await this.prisma.whatsAppBroadcast.create({
      data: {
        name: dto.name,
        mode: dto.mode,
        bodyTemplate: dto.bodyTemplate ?? null,
        templateName: dto.templateName ?? null,
        templateLang: dto.templateLang ?? null,
        templateParams,
        createdByUserId: userId,
        status: WhatsAppBroadcastStatus.QUEUED,
        totalRecipients: parsed.recipients.length,
        recipients: {
          createMany: {
            data: parsed.recipients.map((recipient) => ({
              waId: recipient.waId,
              fields: recipient.fields as unknown as Prisma.InputJsonValue,
            })),
          },
        },
      },
    });

    const ratePerSecond = dto.ratePerSecond ?? this.defaultRatePerSecond;
    // Fire-and-forget: the HTTP request must not block on a long send loop.
    void this.run(broadcast.id, ratePerSecond).catch((err) => {
      this.logger.error({ broadcastId: broadcast.id, err }, 'WhatsApp broadcast crashed');
    });

    return { broadcast, skippedRows: parsed.skipped };
  }

  // ── Send loop ────────────────────────────────────────────────────────────

  /**
   * Send to every PENDING recipient, one at a time, paced to `ratePerSecond`.
   * A recipient's failure never stops the batch; only a fatal credential or
   * account error (see classifySendError) aborts early.
   */
  async run(broadcastId: string, ratePerSecond: number): Promise<void> {
    const broadcast = await this.prisma.whatsAppBroadcast.findUnique({ where: { id: broadcastId } });
    if (!broadcast) return;

    await this.prisma.whatsAppBroadcast.update({
      where: { id: broadcastId },
      data: { status: WhatsAppBroadcastStatus.RUNNING, startedAt: new Date() },
    });

    const minIntervalMs = Math.ceil(1000 / Math.max(ratePerSecond, 1));
    const recipients = await this.prisma.whatsAppBroadcastRecipient.findMany({
      where: { broadcastId, status: WhatsAppBroadcastRecipientStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    let sent = 0;
    let failed = 0;
    let abortReason: string | null = null;

    for (const recipient of recipients) {
      const startedAt = Date.now();
      const fields = recipient.fields as Record<string, string>;

      const outcome = await this.sendWithRetry(broadcast, recipient.waId, fields);

      if (outcome.aborted) {
        abortReason = outcome.result.error ?? 'WhatsApp credentials or account rejected the send';
        await this.prisma.whatsAppBroadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            attempts: outcome.attempts,
            errorCode: outcome.result.errorCode ?? null,
            errorMessage: abortReason,
          },
        });
        break;
      }

      if (outcome.result.messageId) {
        sent += 1;
        await this.prisma.whatsAppBroadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: WhatsAppBroadcastRecipientStatus.SENT,
            waMessageId: outcome.result.messageId,
            attempts: outcome.attempts,
            sentAt: new Date(),
            errorCode: null,
            errorMessage: null,
          },
        });
        // Mirror into the admin inbox so replies land in the same thread and the
        // delivery-status webhook can update this message.
        await this.inbox
          .recordOutboundMessage({
            waId: recipient.waId,
            text: outcome.renderedText,
            waMessageId: outcome.result.messageId,
            type: broadcast.mode === WhatsAppBroadcastMode.TEMPLATE ? 'template' : 'text',
            payload: { broadcastId } as Prisma.InputJsonValue,
          })
          .catch((err) => this.logger.warn({ err, broadcastId }, 'Could not mirror broadcast message to inbox'));
      } else {
        failed += 1;
        await this.prisma.whatsAppBroadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: WhatsAppBroadcastRecipientStatus.FAILED,
            attempts: outcome.attempts,
            errorCode: outcome.result.errorCode ?? null,
            errorMessage: outcome.result.error ?? 'Unknown error',
          },
        });
        this.logger.warn(
          {
            broadcastId,
            to: this.maskNumber(recipient.waId),
            errorCode: outcome.result.errorCode,
            error: outcome.result.error,
          },
          'WhatsApp broadcast recipient failed',
        );
      }

      await this.prisma.whatsAppBroadcast.update({
        where: { id: broadcastId },
        data: { sentCount: sent, failedCount: failed },
      });

      const elapsed = Date.now() - startedAt;
      if (elapsed < minIntervalMs) await this.sleep(minIntervalMs - elapsed);
    }

    await this.prisma.whatsAppBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: abortReason ? WhatsAppBroadcastStatus.FAILED : WhatsAppBroadcastStatus.COMPLETED,
        errorMessage: abortReason,
        sentCount: sent,
        failedCount: failed,
        completedAt: new Date(),
      },
    });

    this.logger.log({ broadcastId, sent, failed, abortReason }, 'WhatsApp broadcast finished');
  }

  /**
   * One recipient, with exponential backoff on transient errors. Returns the
   * last result plus whether the whole batch must stop.
   */
  private async sendWithRetry(
    broadcast: { mode: WhatsAppBroadcastMode; bodyTemplate: string | null; templateName: string | null; templateLang: string | null; templateParams: string[] },
    waId: string,
    fields: Record<string, string>,
  ): Promise<{ result: WhatsAppSendResult; attempts: number; aborted: boolean; renderedText: string }> {
    const isTemplate = broadcast.mode === WhatsAppBroadcastMode.TEMPLATE;
    const params = isTemplate
      ? broadcast.templateParams.map((column) => fields[column.toLowerCase()] ?? '')
      : [];
    const renderedText = isTemplate
      ? `[${broadcast.templateName}] ${params.join(' · ')}`.trim()
      : renderTemplate(broadcast.bodyTemplate ?? '', fields);

    let result: WhatsAppSendResult = { messageId: null, error: 'Not attempted' };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      result = isTemplate
        ? await this.whatsapp.sendTemplateMessage(
            waId,
            broadcast.templateName as string,
            broadcast.templateLang ?? 'en',
            params,
          )
        : await this.whatsapp.sendTextMessage(waId, renderedText);

      if (result.messageId) return { result, attempts: attempt, aborted: false, renderedText };

      const verdict = classifySendError(result.errorCode, result.httpStatus);
      if (verdict === 'abort') return { result, attempts: attempt, aborted: true, renderedText };
      if (verdict === 'fail') return { result, attempts: attempt, aborted: false, renderedText };

      if (attempt < MAX_ATTEMPTS) {
        // Exponential backoff with jitter so a throttled batch doesn't retry in lockstep.
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        await this.sleep(backoff + Math.floor(Math.random() * 250));
      }
    }

    return { result, attempts: MAX_ATTEMPTS, aborted: false, renderedText };
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  async list(query: ListWhatsAppBroadcastsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.whatsAppBroadcast.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.whatsAppBroadcast.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  /** Broadcast detail with every failed recipient, so an operator can see why. */
  async findOne(id: string) {
    const broadcast = await this.prisma.whatsAppBroadcast.findUnique({ where: { id } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');

    const failures = await this.prisma.whatsAppBroadcastRecipient.findMany({
      where: { broadcastId: id, status: WhatsAppBroadcastRecipientStatus.FAILED },
      select: { waId: true, errorCode: true, errorMessage: true, attempts: true },
      take: 200,
    });

    return { ...broadcast, failures };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private maskNumber(digits: string): string {
    return digits.length <= 4 ? '****' : `${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }
}
