import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, WhatsAppMessageDirection } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { getConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../auth/whatsapp.service';
import {
  WHATSAPP_INBOX_INTERNAL_EVENTS,
  type WhatsAppMessageReceivedEvent,
  type WhatsAppMessageStatusEvent,
} from './whatsapp-inbox.events';
import {
  ListWhatsAppConversationsQueryDto,
  ListWhatsAppMessagesQueryDto,
} from './dto/whatsapp-inbox.dto';

/** Shape of the `entry[].changes[].value` object Meta posts for the `messages` field. */
interface WhatsAppChangeValue {
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: WhatsAppInboundMessage[];
  statuses?: WhatsAppStatusUpdate[];
}

interface WhatsAppInboundMessage {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  location?: { name?: string; address?: string };
}

interface WhatsAppStatusUpdate {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: unknown[];
}

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{ id?: string; changes?: Array<{ field?: string; value?: WhatsAppChangeValue }> }>;
}

export interface SignatureCheck {
  valid: boolean;
  /** True when no app secret is configured, so verification was skipped. */
  skipped: boolean;
}

@Injectable()
export class WhatsAppInboxService {
  private readonly logger = new Logger(WhatsAppInboxService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly whatsapp: WhatsAppService,
    private readonly events: EventEmitter2,
  ) {
    this.cfg = getConfig(configService);
  }

  // ── Webhook: verification ────────────────────────────────────────────────

  /** Meta's GET handshake: echo `hub.challenge` when the verify token matches. */
  isValidVerifyToken(mode: string | undefined, token: string | undefined): boolean {
    const expected = this.cfg.whatsapp.webhookVerifyToken?.trim();
    if (!expected || mode !== 'subscribe' || !token) return false;
    return this.safeEqual(Buffer.from(token), Buffer.from(expected));
  }

  /**
   * Verify Meta's `X-Hub-Signature-256: sha256=<hex>` header — an HMAC-SHA256 of the
   * exact raw request body keyed by the app secret.
   *
   * When `WHATSAPP_APP_SECRET` is unset the check is skipped (and reported as such) so
   * a fresh environment can complete the Meta handshake before the secret is provisioned.
   */
  verifySignature(rawBody: Buffer, header: string | undefined): SignatureCheck {
    const secret = this.cfg.whatsapp.appSecret?.trim();
    if (!secret) return { valid: true, skipped: true };
    if (!header?.startsWith('sha256=')) return { valid: false, skipped: false };

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const received = header.slice('sha256='.length);
    let valid = false;
    try {
      valid = this.safeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      valid = false;
    }
    return { valid, skipped: false };
  }

  /** Length-safe constant-time compare (timingSafeEqual throws on length mismatch). */
  private safeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length === 0 || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  // ── Webhook: ingestion ───────────────────────────────────────────────────

  /**
   * Persist every inbound message and outbound status update in the payload.
   * Idempotent: a repeated Meta delivery re-uses the unique `waMessageId`, so
   * duplicate messages are skipped rather than inserted twice.
   */
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<{
    messages: number;
    statuses: number;
  }> {
    let messages = 0;
    let statuses = 0;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        const value = change.value ?? {};

        for (const message of value.messages ?? []) {
          if (await this.recordInboundMessage(value, message)) messages += 1;
        }
        for (const status of value.statuses ?? []) {
          if (await this.applyStatusUpdate(status)) statuses += 1;
        }
      }
    }

    return { messages, statuses };
  }

  private async recordInboundMessage(
    value: WhatsAppChangeValue,
    message: WhatsAppInboundMessage,
  ): Promise<boolean> {
    const waId = message.from?.trim();
    const waMessageId = message.id?.trim();
    if (!waId || !waMessageId) return false;

    // A retried delivery carries the same message id — nothing left to do.
    const existing = await this.prisma.whatsAppMessage.findUnique({
      where: { waMessageId },
      select: { id: true },
    });
    if (existing) return false;

    const contact = (value.contacts ?? []).find((c) => c.wa_id === waId);
    const displayName = contact?.profile?.name?.trim() || null;
    const text = this.extractText(message);
    const timestamp = this.toDate(message.timestamp);

    const conversation = await this.prisma.whatsAppConversation.upsert({
      where: { waId },
      create: {
        waId,
        displayName,
        phoneNumber: `+${waId}`,
        lastMessageAt: timestamp,
        lastMessageText: text,
        unreadCount: 1,
      },
      update: {
        // Meta only sends the profile name when the customer has one set.
        ...(displayName ? { displayName } : {}),
        lastMessageAt: timestamp,
        lastMessageText: text,
        unreadCount: { increment: 1 },
      },
    });

    try {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          waMessageId,
          direction: WhatsAppMessageDirection.INBOUND,
          type: message.type ?? 'text',
          text,
          payload: message as unknown as Prisma.InputJsonValue,
          fromWaId: waId,
          toWaId: value.metadata?.display_phone_number ?? null,
          phoneNumberId: value.metadata?.phone_number_id ?? null,
          timestamp,
        },
      });
    } catch (err) {
      // Concurrent delivery of the same message id lost the race — the row exists.
      if ((err as { code?: string }).code === 'P2002') return false;
      throw err;
    }

    // Pushes the new message to any admin watching the inbox in real time.
    this.events.emit(WHATSAPP_INBOX_INTERNAL_EVENTS.MESSAGE_RECEIVED, {
      conversationId: conversation.id,
      waId,
      displayName,
      text,
      timestamp: timestamp.toISOString(),
    } satisfies WhatsAppMessageReceivedEvent);

    return true;
  }

  private async applyStatusUpdate(status: WhatsAppStatusUpdate): Promise<boolean> {
    const waMessageId = status.id?.trim();
    if (!waMessageId || !status.status) return false;

    const result = await this.prisma.whatsAppMessage.updateMany({
      where: { waMessageId },
      data: {
        status: status.status,
        errorPayload: status.errors?.length
          ? (status.errors as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    if (result.count === 0) return false;

    this.events.emit(WHATSAPP_INBOX_INTERNAL_EVENTS.MESSAGE_STATUS_UPDATED, {
      waMessageId,
      status: status.status,
    } satisfies WhatsAppMessageStatusEvent);

    return true;
  }

  /** Best-effort human-readable body for the conversation list preview. */
  private extractText(message: WhatsAppInboundMessage): string | null {
    switch (message.type) {
      case 'text':
        return message.text?.body?.trim() || null;
      case 'button':
        return message.button?.text?.trim() || null;
      case 'interactive':
        return (
          message.interactive?.button_reply?.title?.trim() ||
          message.interactive?.list_reply?.title?.trim() ||
          null
        );
      case 'image':
        return message.image?.caption?.trim() || '[image]';
      case 'video':
        return message.video?.caption?.trim() || '[video]';
      case 'document':
        return message.document?.caption?.trim() || message.document?.filename?.trim() || '[document]';
      case 'audio':
        return '[audio]';
      case 'location':
        return message.location?.name?.trim() || message.location?.address?.trim() || '[location]';
      default:
        return message.text?.body?.trim() || (message.type ? `[${message.type}]` : null);
    }
  }

  /** Meta sends a Unix timestamp in seconds, as a string. */
  private toDate(timestamp: string | undefined): Date {
    const seconds = Number(timestamp);
    if (!Number.isFinite(seconds) || seconds <= 0) return new Date();
    return new Date(seconds * 1000);
  }

  // ── Admin inbox ──────────────────────────────────────────────────────────

  async listConversations(query: ListWhatsAppConversationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.WhatsAppConversationWhereInput = {
      ...(query.unreadOnly ? { unreadCount: { gt: 0 } } : {}),
      ...(search
        ? {
            OR: [
              { waId: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search, mode: 'insensitive' } },
              { displayName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total, unreadConversations] = await Promise.all([
      this.prisma.whatsAppConversation.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.whatsAppConversation.count({ where }),
      this.prisma.whatsAppConversation.count({ where: { unreadCount: { gt: 0 } } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unreadConversations,
    };
  }

  async listMessages(conversationId: string, query: ListWhatsAppMessagesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const conversation = await this.prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const [items, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.whatsAppMessage.count({ where: { conversationId } }),
    ]);

    return {
      conversation,
      // Oldest-first so the UI can render the thread top-to-bottom.
      items: items.reverse(),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Record a message we sent outside the inbox UI (e.g. a broadcast) so it shows
   * up in the customer's thread and so the delivery-status webhook, which keys
   * off `waMessageId`, can update it later.
   */
  async recordOutboundMessage(input: {
    waId: string;
    text: string;
    waMessageId: string;
    type?: string;
    payload?: Prisma.InputJsonValue;
  }): Promise<void> {
    const now = new Date();
    const conversation = await this.prisma.whatsAppConversation.upsert({
      where: { waId: input.waId },
      create: {
        waId: input.waId,
        phoneNumber: `+${input.waId}`,
        lastMessageAt: now,
        lastMessageText: input.text,
      },
      update: { lastMessageAt: now, lastMessageText: input.text },
    });

    try {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          waMessageId: input.waMessageId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          type: input.type ?? 'text',
          text: input.text,
          status: 'sent',
          fromWaId: this.cfg.whatsapp.phoneNumberId || null,
          toWaId: input.waId,
          phoneNumberId: this.cfg.whatsapp.phoneNumberId || null,
          payload: input.payload,
          timestamp: now,
        },
      });
    } catch (err) {
      // Already recorded (retry of the same wamid) — nothing to do.
      if ((err as { code?: string }).code !== 'P2002') throw err;
    }
  }

  async markRead(conversationId: string) {
    const conversation = await this.prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  }

  /**
   * Reply to a customer. Meta only accepts free-form text inside the 24-hour
   * customer-service window; outside it the send is rejected and nothing is stored.
   */
  async reply(conversationId: string, text: string, agentUserId: string) {
    const body = text.trim();
    if (!body) throw new BadRequestException('Reply text is required');

    const conversation = await this.prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const { messageId, error } = await this.whatsapp.sendTextMessage(conversation.waId, body);
    if (!messageId) {
      this.logger.warn({ conversationId, error }, 'WhatsApp admin reply rejected');
      throw new ServiceUnavailableException(
        error ??
          'WhatsApp rejected the reply. Free-form replies only work within 24 hours of the customer’s last message.',
      );
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.whatsAppMessage.create({
        data: {
          conversationId,
          waMessageId: messageId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          type: 'text',
          text: body,
          status: 'sent',
          fromWaId: this.cfg.whatsapp.phoneNumberId || null,
          toWaId: conversation.waId,
          phoneNumberId: this.cfg.whatsapp.phoneNumberId || null,
          payload: { sentByUserId: agentUserId } as Prisma.InputJsonValue,
        },
      }),
      this.prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date(), lastMessageText: body, unreadCount: 0 },
      }),
    ]);

    return message;
  }
}
