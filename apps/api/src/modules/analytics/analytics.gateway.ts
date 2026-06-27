import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../../common/websocket/ws-auth.service';
import { wsGatewayCorsOptions } from '../../common/websocket/ws-cors.util';
import type { RequestUser } from '../../common/types';
import { AnalyticsService } from './analytics.service';

export const ANALYTICS_EVENTS = {
  CONTROL_ROOM_UPDATED: 'control-room.updated',
} as const;

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser };
}

@WebSocketGateway({ cors: wsGatewayCorsOptions(), namespace: '/analytics' })
export class AnalyticsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AnalyticsGateway.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly wsAuth: WsAuthService,
  ) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: AuthenticatedSocket): void {
    const user = this.wsAuth.authenticateSocket(client);
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      this.logger.warn(`Rejected non-admin analytics socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    client.data.user = user;
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return { error: 'Admin access required' };
    }

    client.join('control-room');
    void this.pushControlRoom();
    return { subscribed: 'control-room' };
  }

  @OnEvent('analytics.materialized')
  onMaterialized() {
    void this.pushControlRoom();
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pushControlRoom() {
    try {
      const payload = await this.analytics.getControlRoom();
      this.server.to('control-room').emit(ANALYTICS_EVENTS.CONTROL_ROOM_UPDATED, payload);
    } catch (err) {
      this.logger.warn(`Control room push failed: ${(err as Error).message}`);
    }
  }
}
