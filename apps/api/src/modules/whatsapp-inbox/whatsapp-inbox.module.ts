import { Module } from '@nestjs/common';
import { WebSocketModule } from '../../common/websocket/websocket.module';
import { WhatsAppService } from '../auth/whatsapp.service';
import { AdminWhatsAppController } from './admin-whatsapp.controller';
import { WhatsAppInboxGateway } from './whatsapp-inbox.gateway';
import { WhatsAppInboxService } from './whatsapp-inbox.service';

/**
 * Inbound WhatsApp inbox: webhook ingestion (see WebhooksModule), the admin
 * conversation/message API, and the real-time gateway that pushes new messages
 * to the admin UI.
 *
 * `WhatsAppService` is provided locally (it only depends on ConfigService) rather
 * than importing AuthModule, mirroring PushModule and avoiding a circular import.
 */
@Module({
  imports: [WebSocketModule],
  controllers: [AdminWhatsAppController],
  providers: [WhatsAppInboxService, WhatsAppInboxGateway, WhatsAppService],
  exports: [WhatsAppInboxService],
})
export class WhatsAppInboxModule {}
