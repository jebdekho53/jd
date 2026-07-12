import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import { WsRoomAccessService } from '../../common/websocket/ws-room-access.service';
import { wsGatewayCorsOptions } from '../../common/websocket/ws-cors.util';
import {
  ADMIN_FLEET_ROOM,
  orderRoom,
  productRoom,
  riderRoom,
  roomNameFor,
  storeRoom,
  type RoomScope,
} from '../../common/websocket/ws-rooms';
import type { RequestUser } from '../../common/types';
import { COMMERCE_EVENTS } from '../realtime/realtime.events';
import { FLEET_UPDATED_EVENT, TRACKING_EVENTS } from './delivery-tracking.events';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser };
}

@WebSocketGateway({
  cors: wsGatewayCorsOptions(),
  namespace: '/tracking',
})
export class DeliveryTrackingGateway implements OnGatewayConnection {
  private readonly logger = new Logger(DeliveryTrackingGateway.name);

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly rooms: WsRoomAccessService,
  ) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: AuthenticatedSocket): void {
    const user = this.wsAuth.authenticateSocket(client);
    if (!user) {
      this.logger.warn(`Rejected unauthenticated tracking socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    client.data.user = user;
  }

  /**
   * Clients name the room they want directly (`{ type: 'order', id }`,
   * `{ type: 'store', id }`, …) and the access service proves ownership. The
   * previous `{ namespace, id }` shape conflated "who am I" with "what am I
   * watching", which is how merchants ended up joining `merchant:<orderId>`
   * while every merchant event published to `merchant:<storeId>`.
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() scope: RoomScope,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'Unauthorized' };
    if (!scope?.type) return { error: 'Invalid subscription payload' };

    try {
      await this.rooms.assertCanJoin(user, scope);
    } catch {
      this.logger.warn(`Tracking subscribe denied for user ${user.id} scope=${scope.type}`);
      return { error: 'Access denied' };
    }

    const room = roomNameFor(scope);
    await client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { subscribed: room };
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() scope: RoomScope,
  ) {
    if (!client.data.user || !scope?.type) return { error: 'Invalid payload' };
    const room = roomNameFor(scope);
    await client.leave(room);
    return { unsubscribed: room };
  }

  @OnEvent(`ws.${TRACKING_EVENTS.LOCATION_UPDATED}`)
  onLocationUpdated(payload: Record<string, unknown>) {
    this.fanOut(TRACKING_EVENTS.LOCATION_UPDATED, payload);
    this.fanOut(TRACKING_EVENTS.ORDER_LOCATION_UPDATED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.ETA_UPDATED}`)
  onEtaUpdated(payload: Record<string, unknown>) {
    this.fanOut(TRACKING_EVENTS.ETA_UPDATED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.STARTED}`)
  onStarted(payload: Record<string, unknown>) {
    this.fanOut(TRACKING_EVENTS.STARTED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.ARRIVED}`)
  onArrived(payload: Record<string, unknown>) {
    this.fanOut(TRACKING_EVENTS.ARRIVED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.COMPLETED}`)
  onCompleted(payload: Record<string, unknown>) {
    this.fanOut(TRACKING_EVENTS.COMPLETED, payload);
  }

  @OnEvent(`ws.${TRACKING_EVENTS.ORDER_STATUS}`)
  onOrderStatus(payload: Record<string, unknown>) {
    this.fanOut(TRACKING_EVENTS.ORDER_STATUS, payload);
  }

  /**
   * A brand-new order has no watchers on its own room yet — the merchant is
   * looking at the store board, so that is where the alert has to land.
   */
  @OnEvent(`ws.${COMMERCE_EVENTS.ORDER_CREATED}`)
  onOrderCreated(payload: Record<string, unknown>) {
    const envelope = { event: COMMERCE_EVENTS.ORDER_CREATED, ...payload, at: new Date().toISOString() };
    if (payload.storeId) {
      this.server?.to(storeRoom(payload.storeId as string)).emit(COMMERCE_EVENTS.ORDER_CREATED, envelope);
    }
    this.server?.to(ADMIN_FLEET_ROOM).emit(COMMERCE_EVENTS.ORDER_CREATED, envelope);
  }

  /** Buyers watch a single product; merchants and admins watch the store. */
  @OnEvent(`ws.${COMMERCE_EVENTS.INVENTORY_UPDATED}`)
  onInventoryUpdated(payload: Record<string, unknown>) {
    const event = COMMERCE_EVENTS.INVENTORY_UPDATED;
    const envelope = { event, ...payload, at: new Date().toISOString() };
    if (payload.productId) {
      this.server?.to(productRoom(payload.productId as string)).emit(event, envelope);
    }
    if (payload.storeId) {
      this.server?.to(storeRoom(payload.storeId as string)).emit(event, envelope);
    }
  }

  @OnEvent('ws.fleet.snapshot')
  onFleetSnapshot(payload: Record<string, unknown>) {
    this.server?.to(ADMIN_FLEET_ROOM).emit(FLEET_UPDATED_EVENT, {
      event: FLEET_UPDATED_EVENT,
      ...payload,
      at: new Date().toISOString(),
    });
  }

  /**
   * One event reaches every party entitled to it: the order's own room (buyer,
   * merchant and rider all watch it), the store board, the rider's own feed,
   * and the admin fleet view. Rooms with no members are a no-op.
   */
  private fanOut(event: string, payload: Record<string, unknown>) {
    const envelope = { event, ...payload, at: new Date().toISOString() };
    const targets = new Set<string>([ADMIN_FLEET_ROOM]);

    if (payload.orderId) targets.add(orderRoom(payload.orderId as string));
    if (payload.storeId) targets.add(storeRoom(payload.storeId as string));
    if (payload.riderProfileId) targets.add(riderRoom(payload.riderProfileId as string));

    for (const room of targets) {
      this.server?.to(room).emit(event, envelope);
    }
  }
}
