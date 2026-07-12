import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FLEET_EVENTS } from './fleet-os.events';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import { wsGatewayCorsOptions } from '../../common/websocket/ws-cors.util';
import { FLEET_OPS_ROOM } from '../../common/websocket/ws-rooms';
import type { RequestUser } from '../../common/types';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser };
}

/**
 * Fleet operations feed — clustering, batching, alerts, route optimization.
 * Ops-only data, so the namespace is closed to non-admins at connect time
 * rather than relying on the client to not subscribe.
 */
@WebSocketGateway({ cors: wsGatewayCorsOptions(), namespace: '/fleet' })
export class FleetOsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(FleetOsGateway.name);

  constructor(private readonly wsAuth: WsAuthService) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: AuthenticatedSocket): void {
    const user = this.wsAuth.authenticateSocket(client);
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      this.logger.warn(`Rejected non-admin fleet socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    client.data.user = user;
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return { error: 'Admin access required' };
    }

    await client.join(FLEET_OPS_ROOM);
    this.logger.debug(`Fleet client ${client.id} joined ${FLEET_OPS_ROOM}`);
    return { subscribed: FLEET_OPS_ROOM };
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
    this.server?.to(FLEET_OPS_ROOM).emit(event, { event, ...payload, at: new Date().toISOString() });
  }
}
