import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TRACKING_EVENTS, orderRoom, trackingRoom, type TrackingNamespace } from './delivery-tracking.events';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tracking',
})
export class DeliveryTrackingGateway {
  private readonly logger = new Logger(DeliveryTrackingGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { namespace: TrackingNamespace; id: string; orderId?: string },
  ) {
    const room = trackingRoom(data.namespace, data.id);
    client.join(room);
    if (data.orderId) {
      client.join(orderRoom(data.orderId));
    }
    this.logger.debug(`Client ${client.id} joined ${room}${data.orderId ? ` + ${orderRoom(data.orderId)}` : ''}`);
    return { subscribed: room, orderId: data.orderId ?? null };
  }

  @OnEvent(`ws.${TRACKING_EVENTS.LOCATION_UPDATED}`)
  onLocationUpdated(payload: Record<string, unknown>) {
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.LOCATION_UPDATED, payload);
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.ORDER_LOCATION_UPDATED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.ETA_UPDATED}`)
  onEtaUpdated(payload: Record<string, unknown>) {
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.ETA_UPDATED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.STARTED}`)
  onStarted(payload: Record<string, unknown>) {
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.STARTED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.ARRIVED}`)
  onArrived(payload: Record<string, unknown>) {
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.ARRIVED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.COMPLETED}`)
  onCompleted(payload: Record<string, unknown>) {
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.COMPLETED, payload);
    this.server?.to(trackingRoom('admin', 'fleet')).emit(TRACKING_EVENTS.COMPLETED, {
      event: TRACKING_EVENTS.COMPLETED,
      ...payload,
      at: new Date().toISOString(),
    });
  }

  @OnEvent(`ws.${TRACKING_EVENTS.ORDER_STATUS}`)
  onOrderStatus(payload: Record<string, unknown>) {
    this.emitToOrder(payload.orderId as string, TRACKING_EVENTS.ORDER_STATUS, payload);
  }

  @OnEvent('ws.fleet.snapshot')
  onFleetSnapshot(payload: Record<string, unknown>) {
    this.server?.to(trackingRoom('admin', 'fleet')).emit('fleet.updated', {
      event: 'fleet.updated',
      ...payload,
      at: new Date().toISOString(),
    });
  }

  private emitToOrder(orderId: string | undefined, event: string, payload: Record<string, unknown>) {
    if (!orderId) return;
    const envelope = { event, ...payload, at: new Date().toISOString() };
    this.server?.to(orderRoom(orderId)).emit(event, envelope);
    if (payload.storeId) {
      this.server?.to(trackingRoom('merchant', payload.storeId as string)).emit(event, envelope);
    }
    if (payload.riderProfileId) {
      this.server?.to(trackingRoom('rider', payload.riderProfileId as string)).emit(event, envelope);
    }
    this.server?.to(trackingRoom('admin', 'fleet')).emit(event, envelope);
  }
}
