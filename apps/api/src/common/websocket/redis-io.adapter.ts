import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions, Server } from 'socket.io';

/**
 * Socket.IO adapter backed by Redis pub/sub.
 *
 * The API runs multiple replicas (docker-compose.prod.yml). Socket.IO's default
 * adapter keeps room membership in process memory, so `server.to(room).emit()`
 * on one replica never reaches sockets held by another — roughly half of all
 * events vanish depending on which replica a client's connection landed on.
 * The Redis adapter relays every emit over pub/sub so all replicas fan out.
 */
export class RedisIoAdapter extends IoAdapter {
  private static readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private clients: Redis[] = [];

  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  async connect(): Promise<void> {
    const configService = this.app.get(ConfigService);
    const configured = configService.get<string>('REDIS_URL');
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    if (!configured && nodeEnv === 'production') {
      throw new Error('REDIS_URL is required in production for the Socket.IO adapter');
    }
    const url = configured ?? 'redis://127.0.0.1:6379';

    // A Redis connection in subscriber mode cannot issue ordinary commands, so
    // the adapter needs two dedicated clients rather than reusing RedisService.
    const pubClient = new Redis(url, { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();

    for (const [name, client] of [
      ['pub', pubClient],
      ['sub', subClient],
    ] as const) {
      client.on('error', (err: Error) =>
        RedisIoAdapter.logger.error(`Socket.IO Redis ${name} client error: ${err.message}`),
      );
    }

    await Promise.all([pubClient.ping(), subClient.ping()]);

    this.clients = [pubClient, subClient];
    this.adapterConstructor = createAdapter(pubClient, subClient, {
      key: 'jebdekho:socket.io',
    });

    RedisIoAdapter.logger.log('Socket.IO Redis adapter connected — cross-replica fanout enabled');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (!this.adapterConstructor) {
      throw new Error('RedisIoAdapter.connect() must be awaited before createIOServer()');
    }
    server.adapter(this.adapterConstructor);
    return server;
  }

  async close(): Promise<void> {
    await Promise.allSettled(this.clients.map((c) => c.quit()));
    this.clients = [];
  }
}
