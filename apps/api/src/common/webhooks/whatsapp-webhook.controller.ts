import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { WebhookProvider } from '@prisma/client';
import { Request } from 'express';
import {
  WhatsAppInboxService,
  WhatsAppWebhookPayload,
} from '../../modules/whatsapp-inbox/whatsapp-inbox.service';
import { WebhookDedupService } from './webhook-dedup.service';

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * Callback URL: https://api.jebdekho.com/api/v1/webhooks/whatsapp
 *
 * - GET  — Meta's subscription handshake; echoes `hub.challenge` when
 *          `hub.verify_token` matches WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 * - POST — inbound messages and outbound delivery statuses. The body is
 *          authenticated with `X-Hub-Signature-256` (HMAC-SHA256 of the raw body
 *          keyed by WHATSAPP_APP_SECRET) and deduplicated before persistence.
 *
 * Payloads are never logged: they carry customer phone numbers and message text.
 */
@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly inbox: WhatsAppInboxService,
    private readonly dedup: WebhookDedupService,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    if (!this.inbox.isValidVerifyToken(mode, token)) {
      this.logger.warn({ mode }, 'Rejected WhatsApp webhook verification handshake');
      throw new ForbiddenException('Invalid WhatsApp webhook verify token');
    }
    return challenge;
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: WhatsAppWebhookPayload,
  ): Promise<{ success: boolean; duplicate?: boolean }> {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Missing request body');

    const check = this.inbox.verifySignature(rawBody, signature);
    if (!check.valid) {
      this.logger.warn('Rejected WhatsApp webhook with an invalid X-Hub-Signature-256');
      throw new UnauthorizedException('Invalid webhook signature');
    }
    if (check.skipped) {
      this.logger.warn(
        'WHATSAPP_APP_SECRET is not set — accepting WhatsApp webhook without signature verification',
      );
    }

    // Meta sends no event id, so the dedup service derives one from the payload hash.
    const claim = await this.dedup.claimEvent(WebhookProvider.WHATSAPP, null, rawBody, signature);
    if (claim.action === 'duplicate') return { success: true, duplicate: true };

    try {
      const { messages, statuses } = await this.inbox.processWebhook(body);
      await this.dedup.markProcessed(claim.recordId);
      this.logger.log({ messages, statuses }, 'WhatsApp webhook processed');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.dedup.markFailed(claim.recordId, message);
      // Rethrow so Meta retries with backoff instead of dropping the message.
      throw err;
    }
  }
}
