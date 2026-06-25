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
import { FLEET_EVENTS, FLEET_ROOM } from './fleet-os.events';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/fleet' })
export class FleetOsGateway {
  private readonly logger = new Logger(FleetOsGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { role?: string; id?: string }) {
    client.join(FLEET_ROOM);
    if (data?.role && data?.id) {
      client.join(`${data.role}:${data.id}`);
    }
    this.logger.debug(`Fleet client ${client.id} joined ${FLEET_ROOM}`);
    return { subscribed: FLEET_ROOM };
  }

  @OnEvent(`ws.${FLEET_EVENTS.CLUSTER_UPDATED}`)
  onClusterUpdated(payload: Record<string, unknown>) {
    this.emit(FLEET_EVENTS.CLUSTER_UPDATED, payload);
  }

  @OnEvent(`ws.${FLEET_EVENTS.BATCH_CREATED}`)
  onBatchCreated(payload: Record<string, unknown>) {
    this.emit(FLEET_EVENTS.BATCH_CREATED, payload);
  }

  @OnEvent(`ws.${FLEET_EVENTS.BATCH_UPDATED}`)
  onBatchUpdated(payload: Record<string, unknown>) {
    this.emit(FLEET_EVENTS.BATCH_UPDATED, payload);
  }

  @OnEvent(`ws.${FLEET_EVENTS.ALERT_CREATED}`)
  onAlertCreated(payload: Record<string, unknown>) {
    this.emit(FLEET_EVENTS.ALERT_CREATED, payload);
  }

  @OnEvent(`ws.${FLEET_EVENTS.ROUTE_OPTIMIZED}`)
  onRouteOptimized(payload: Record<string, unknown>) {
    this.emit(FLEET_EVENTS.ROUTE_OPTIMIZED, payload);
  }

  private emit(event: string, payload: Record<string, unknown>) {
    this.server?.to(FLEET_ROOM).emit(event, { event, ...payload, at: new Date().toISOString() });
  }
}
