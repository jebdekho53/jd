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
import { RIDER_ASSIGNMENT_EVENTS } from './rider-assignment.service';
import { wsGatewayCorsOptions } from '../../common/websocket/ws-cors.util';

@WebSocketGateway({
  cors: wsGatewayCorsOptions(),
  namespace: '/rider-assignment',
})
export class RiderAssignmentGateway {
  private readonly logger = new Logger(RiderAssignmentGateway.name);

  @WebSocketServer()
  server!: Server;

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.ASSIGNED}`)
  onAssigned(payload: { orderId: string; riderProfileId: string }) {
    this.broadcast(RIDER_ASSIGNMENT_EVENTS.ASSIGNED, payload);
  }

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.REASSIGNED}`)
  onReassigned(payload: { orderId: string; riderProfileId: string }) {
    this.broadcast(RIDER_ASSIGNMENT_EVENTS.REASSIGNED, payload);
  }

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.UNASSIGNED}`)
  onUnassigned(payload: { orderId: string }) {
    this.broadcast(RIDER_ASSIGNMENT_EVENTS.UNASSIGNED, payload);
  }

  @OnEvent(`ws.${RIDER_ASSIGNMENT_EVENTS.LOCATION_UPDATED}`)
  onLocationUpdated(payload: { riderProfileId: string; lat: number; lng: number }) {
    this.broadcast(RIDER_ASSIGNMENT_EVENTS.LOCATION_UPDATED, payload);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { role: string; id: string },
  ) {
    const room = `${data.role}:${data.id}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { subscribed: room };
  }

  private broadcast(event: string, payload: Record<string, unknown>) {
    this.server?.emit(event, { event, ...payload, at: new Date().toISOString() });
  }
}
