import { Module, forwardRef } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { BuyerPushController } from './buyer-push.controller';
import { BuyerPushSubscriptionService } from './buyer-push-subscription.service';
import { BuyerPushNotificationService } from './buyer-push-notification.service';
import { BuyerPushListener } from './buyer-push.listener';
import { WebPushService } from './web-push.service';
import { WhatsAppService } from '../auth/whatsapp.service';

@Module({
  imports: [forwardRef(() => CrmModule)],
  controllers: [BuyerPushController],
  providers: [
    WebPushService,
    BuyerPushSubscriptionService,
    BuyerPushNotificationService,
    BuyerPushListener,
    // Stateless (ConfigService-only) — provided locally to send order-update
    // messages via the WhatsApp Cloud API without coupling PushModule to AuthModule.
    WhatsAppService,
  ],
  exports: [BuyerPushNotificationService, WebPushService, BuyerPushSubscriptionService],
})
export class PushModule {}
