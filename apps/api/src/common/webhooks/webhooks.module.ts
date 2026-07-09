import { Global, Module } from '@nestjs/common';
import { WebhookDedupService } from './webhook-dedup.service';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';

@Global()
@Module({
  controllers: [WhatsAppWebhookController],
  providers: [WebhookDedupService],
  exports: [WebhookDedupService],
})
export class WebhooksModule {}
