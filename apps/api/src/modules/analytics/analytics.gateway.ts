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
import { CONTROL_ROOM } from '../../common/websocket/ws-rooms';
import { DistributedLockService } from '../../redis/distributed-lock.service';
import type { RequestUser } from '../../common/types';
import { AnalyticsService } from './analytics.service';

export const ANALYTICS_EVENTS = {
  CONTROL_ROOM_UPDATED: 'control-room.updated',
} as const;

/**
 * Held just under the cron interval, never released early. Every replica runs
 * the same cron, and the Redis adapter fans each emit out to the whole cluster,
 * so without a fence subscribers would receive one identical payload per
 * replica. Letting the key expire (rather than releasing it after the push)
 * keeps the window closed for the rest of the tick.
 */
const PUSH_LOCK_KEY = 'analytics:control-room-push';
const PUSH_FENCE_SECONDS = 25;
const EVENT_FENCE_SECONDS = 5;

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser };
}

@WebSocketGateway({ cors: wsGatewayCorsOptions(), namespace: '/analytics' })
export class AnalyticsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AnalyticsGateway.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly wsAuth: WsAuthService,
    private readonly locks: DistributedLockService,
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
  async handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user || !this.wsAuth.hasAnyRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return { error: 'Admin access required' };
    }

    await client.join(CONTROL_ROOM);

    // Seed this client alone. A room-wide push here would both spam existing
    // admins and get swallowed by the cron fence.
    try {
      const payload = await this.analytics.getControlRoom();
      client.emit(ANALYTICS_EVENTS.CONTROL_ROOM_UPDATED, payload);
    } catch (err) {
      this.logger.warn(`Control room snapshot failed: ${(err as Error).message}`);
    }

    return { subscribed: CONTROL_ROOM };
  }

  @OnEvent('analytics.materialized')
  onMaterialized() {
    void this.broadcastControlRoom(EVENT_FENCE_SECONDS);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pushControlRoom(): Promise<void> {
    await this.broadcastControlRoom(PUSH_FENCE_SECONDS);
  }

  /** Broadcasts at most once per `fenceSeconds` across the whole cluster. */
  private async broadcastControlRoom(fenceSeconds: number): Promise<void> {
    const token = await this.locks.tryAcquire(PUSH_LOCK_KEY, fenceSeconds);
    if (!token) return; // Another replica already pushed this tick.

    try {
      const payload = await this.analytics.getControlRoom();
      this.server?.to(CONTROL_ROOM).emit(ANALYTICS_EVENTS.CONTROL_ROOM_UPDATED, payload);
    } catch (err) {
      this.logger.warn(`Control room push failed: ${(err as Error).message}`);
    }
  }
}
