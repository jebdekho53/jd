import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { WsAuthService } from '../../../common/websocket/ws-auth.service';
import { MerchantService } from '../../merchant/merchant.service';
import { wsGatewayCorsOptions } from '../../../common/websocket/ws-cors.util';
import type { RequestUser } from '../../../common/types';
import { AI_PROGRESS_CHANNEL, ProgressEvent } from '../services/ai-catalog-progress.service';
import { AI_WS_EVENT, AI_WS_NAMESPACE } from '../ai-catalog.constants';
import { parseRedisUrl } from '../queue/ai-catalog-queue.module';

interface AuthedSocket extends Socket {
  data: Socket['data'] & { user?: RequestUser; merchantProfileId?: string };
}

const merchantRoom = (merchantProfileId: string): string => `ai:merchant:${merchantProfileId}`;

/**
 * Realtime progress transport. Runs in the API process. Because workers live in
 * a SEPARATE process, they publish progress to a Redis channel; this gateway
 * subscribes and fans each event out to the ONE authenticated merchant room it
 * belongs to — a merchant can never receive another merchant's progress. The
 * DB remains source of truth; clients re-poll job state on reconnect, so a
 * dropped socket message is never fatal.
 */
@WebSocketGateway({ cors: wsGatewayCorsOptions(), namespace: AI_WS_NAMESPACE })
export class AiCatalogGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiCatalogGateway.name);
  private subscriber?: Redis;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly merchantService: MerchantService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
    this.subscriber = new Redis({ ...parseRedisUrl(url), maxRetriesPerRequest: null });
    await this.subscriber.subscribe(AI_PROGRESS_CHANNEL);
    this.subscriber.on('message', (_channel, raw) => this.fanOut(raw));
    this.logger.log(`Subscribed to ${AI_PROGRESS_CHANNEL} for AI catalog progress`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber?.quit();
  }

  async handleConnection(client: AuthedSocket): Promise<void> {
    const user = this.wsAuth.authenticateSocket(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    // Auto-join the caller's OWN merchant room; no client-supplied ids trusted.
    try {
      const profile = await this.merchantService.requireMerchantProfile(user.id);
      client.data.merchantProfileId = profile.id;
      await client.join(merchantRoom(profile.id));
    } catch {
      // Not a merchant — allow the socket but it joins no room (receives nothing).
      this.logger.debug(`Socket ${client.id} authenticated but has no merchant profile`);
    }
  }

  private fanOut(raw: string): void {
    let event: ProgressEvent;
    try {
      event = JSON.parse(raw) as ProgressEvent;
    } catch {
      return;
    }
    if (!event.merchantProfileId) return;
    const room = merchantRoom(event.merchantProfileId);
    const name = this.eventName(event);
    this.server.to(room).emit(name, event);
  }

  private eventName(event: ProgressEvent): string {
    switch (event.status) {
      case 'COMPLETED':
        return event.outputType ? AI_WS_EVENT.IMAGE_READY : AI_WS_EVENT.JOB_COMPLETED;
      case 'FAILED':
        return AI_WS_EVENT.JOB_FAILED;
      case 'MODERATION_PENDING':
        return AI_WS_EVENT.MODERATION_UPDATE;
      default:
        return AI_WS_EVENT.JOB_PROGRESS;
    }
  }
}
