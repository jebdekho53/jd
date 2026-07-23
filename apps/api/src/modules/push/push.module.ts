import { Module, forwardRef } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { BuyerPushController } from './buyer-push.controller';
import { RiderPushController } from './rider-push.controller';
import { RiderPushNotificationService } from './rider-push-notification.service';
import { PushSubscriptionService } from './push-subscription.service';
import { BuyerPushNotificationService } from './buyer-push-notification.service';
import { BuyerPushListener } from './buyer-push.listener';
import { WebPushService } from './web-push.service';
import { WhatsAppService } from '../auth/whatsapp.service';

@Module({
  imports: [forwardRef(() => CrmModule)],
  controllers: [BuyerPushController, RiderPushController],
  providers: [
    WebPushService,
    PushSubscriptionService,
    BuyerPushNotificationService,
    RiderPushNotificationService,
    BuyerPushListener,
    // Stateless (ConfigService-only) — provided locally to send order-update
    // messages via the WhatsApp Cloud API without coupling PushModule to AuthModule.
    WhatsAppService,
  ],
  exports: [
    BuyerPushNotificationService,
    RiderPushNotificationService,
    WebPushService,
    PushSubscriptionService,
  ],
})
export class PushModule {}
