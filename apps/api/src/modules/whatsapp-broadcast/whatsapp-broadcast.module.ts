import { Module } from '@nestjs/common';
import { WhatsAppService } from '../auth/whatsapp.service';
import { WhatsAppInboxModule } from '../whatsapp-inbox/whatsapp-inbox.module';
import { AdminWhatsAppBroadcastController } from './admin-whatsapp-broadcast.controller';
import { WhatsAppBroadcastService } from './whatsapp-broadcast.service';

/**
 * Personalized bulk WhatsApp sends from a CSV upload. Reuses WhatsAppService for
 * the Cloud API transport and WhatsAppInboxService so every sent message shows
 * up in the admin inbox thread.
 */
@Module({
  imports: [WhatsAppInboxModule],
  controllers: [AdminWhatsAppBroadcastController],
  providers: [WhatsAppBroadcastService, WhatsAppService],
  exports: [WhatsAppBroadcastService],
})
export class WhatsAppBroadcastModule {}
