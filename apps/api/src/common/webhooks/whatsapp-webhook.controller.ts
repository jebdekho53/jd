import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
} from '@nestjs/common';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && verifyToken && token === verifyToken) {
      return challenge;
    }

    throw new ForbiddenException('Invalid WhatsApp webhook verify token');
  }

  @Post()
  @HttpCode(200)
  handleWebhook(@Body() body: unknown) {
    this.logger.log(`WhatsApp webhook received: ${JSON.stringify(body)}`);

    return { success: true };
  }
}
