import { Global, Module } from '@nestjs/common';
import { WhatsAppInboxModule } from '../../modules/whatsapp-inbox/whatsapp-inbox.module';
import { WebhookDedupService } from './webhook-dedup.service';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';

@Global()
@Module({
  imports: [WhatsAppInboxModule],
  controllers: [WhatsAppWebhookController],
  providers: [WebhookDedupService],
  exports: [WebhookDedupService],
})
export class WebhooksModule {}
