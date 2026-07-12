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
import { RIDER_ASSIGNMENT_EVENTS } from './rider-assignment.service';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import { WsRoomAccessService } from '../../common/websocket/ws-room-access.service';
import { wsGatewayCorsOptions } from '../../common/websocket/ws-cors.util';
import {
  ADMIN_FLEET_ROOM,
  orderRoom,
  riderRoom,
  roomNameFor,
  type RoomScope,
} from '../../common/websocket/ws-rooms';
import type { RequestUser } from '../../common/types';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser };
}

/**
 * Assignment lifecycle + rider telemetry.
 *
 * Every emit is room-scoped. This gateway previously called `server.emit()`,
 * which delivers to every socket in the namespace — combined with the absent
 * connection guard, any anonymous client could read live rider coordinates and
 * order IDs for the entire platform.
 */
@WebSocketGateway({
  cors: wsGatewayCorsOptions(),
  namespace: '/rider-assignment',
})
export class RiderAssignmentGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RiderAssignmentGateway.name);

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly rooms: WsRoomAccessService,
  ) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: AuthenticatedSocket): void {
    const user = this.wsAuth.authenticateSocket(client);
    if (!user) {
      this.logger.warn(`Rejected unauthenticated rider-assignment socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    client.data.user = user;
  }

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
      this.logger.warn(`Assignment subscribe denied for user ${user.id} scope=${scope.type}`);
      return { error: 'Access denied' };
    }

    const room = roomNameFor(scope);
    await client.join(room);
    return { subscribed: room };
  }

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.ASSIGNED}`)
  onAssigned(payload: { orderId: string; riderProfileId: string }) {
    this.emitAssignment(RIDER_ASSIGNMENT_EVENTS.ASSIGNED, payload);
  }

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.REASSIGNED}`)
  onReassigned(payload: { orderId: string; riderProfileId: string }) {
    this.emitAssignment(RIDER_ASSIGNMENT_EVENTS.REASSIGNED, payload);
  }

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.UNASSIGNED}`)
  onUnassigned(payload: { orderId: string }) {
    this.emitAssignment(RIDER_ASSIGNMENT_EVENTS.UNASSIGNED, payload);
  }

  /**
   * Rider coordinates carry no orderId, so they reach only the rider's own room
   * and the admin fleet view — never a namespace-wide broadcast.
   */
  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.LOCATION_UPDATED}`)
  onLocationUpdated(payload: { riderProfileId: string; lat: number; lng: number }) {
    const event = RIDER_ASSIGNMENT_EVENTS.LOCATION_UPDATED;
    const envelope = this.envelope(event, payload);
    this.server?.to(riderRoom(payload.riderProfileId)).emit(event, envelope);
    this.server?.to(ADMIN_FLEET_ROOM).emit(event, envelope);
  }

  private emitAssignment(event: string, payload: { orderId: string; riderProfileId?: string }) {
    const envelope = this.envelope(event, payload);
    this.server?.to(orderRoom(payload.orderId)).emit(event, envelope);
    if (payload.riderProfileId) {
      this.server?.to(riderRoom(payload.riderProfileId)).emit(event, envelope);
    }
    this.server?.to(ADMIN_FLEET_ROOM).emit(event, envelope);
  }

  private envelope(event: string, payload: Record<string, unknown>) {
    return { event, ...payload, at: new Date().toISOString() };
  }
}
