import { Module } from '@nestjs/common';
import { CommerceRealtimeListener } from './commerce-realtime.listener';

/**
 * Bridges persisted domain events onto the WebSocket fan-out channels the
 * gateways listen on. Holds no gateway of its own — `DeliveryTrackingGateway`
 * owns the order/store/product rooms these events target.
 */
@Module({
  providers: [CommerceRealtimeListener],
})
export class RealtimeModule {}
