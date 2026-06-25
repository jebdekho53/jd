import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AnalyticsService } from './analytics.service';

export const ANALYTICS_EVENTS = {
  CONTROL_ROOM_UPDATED: 'control-room.updated',
} as const;

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/analytics' })
export class AnalyticsGateway {
  private readonly logger = new Logger(AnalyticsGateway.name);

  constructor(private readonly analytics: AnalyticsService) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket) {
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
