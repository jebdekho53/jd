import { Module } from '@nestjs/common';
import { OrderTimelineModule } from '../order/order-timeline.module';
import { WebSocketModule } from '../../common/websocket/websocket.module';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { DeliveryTrackingGateway } from './delivery-tracking.gateway';
import { DeliveryTrackingCacheService } from './delivery-tracking-cache.service';
import {
  AdminTrackingController,
  BuyerTrackingController,
  MerchantTrackingController,
} from './delivery-tracking.controller';

@Module({
  imports: [OrderTimelineModule, WebSocketModule],
  controllers: [BuyerTrackingController, MerchantTrackingController, AdminTrackingController],
  providers: [DeliveryTrackingService, DeliveryTrackingGateway, DeliveryTrackingCacheService],
  exports: [DeliveryTrackingService, DeliveryTrackingCacheService],
})
export class DeliveryTrackingModule {}
