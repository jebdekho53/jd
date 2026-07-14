import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AI_QUEUE, AI_JOB_DEFAULTS } from '../ai-catalog.constants';
import { AiCatalogQueueService } from './ai-catalog-queue.service';

/**
 * Registers the BullMQ root connection + the four AI pipeline queues over the
 * existing Redis instance (REDIS_URL). BullMQ requires `maxRetriesPerRequest:
 * null` on its blocking connection, so we build a dedicated connection config
 * here rather than reusing the app's shared ioredis client.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
        return {
          connection: {
            // ioredis accepts a URL via the `path`-less connection; bullmq wants
            // an options object, so parse the URL into host/port/password/db.
            ...parseRedisUrl(url),
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
          },
          prefix: config.get<string>('BULLMQ_PREFIX', 'jebdekho:bull'),
          defaultJobOptions: AI_JOB_DEFAULTS,
        };
      },
    }),
    BullModule.registerQueue(
      { name: AI_QUEUE.ANALYSIS },
      { name: AI_QUEUE.IMAGE },
      { name: AI_QUEUE.RETRY },
      { name: AI_QUEUE.MODERATION },
    ),
  ],
  providers: [AiCatalogQueueService],
  exports: [AiCatalogQueueService, BullModule],
})
export class AiCatalogQueueModule {}

/** Parse a redis:// URL into a bullmq/ioredis connection options object. */
export function parseRedisUrl(url: string): {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
} {
  const parsed = new URL(url);
  const db = parsed.pathname && parsed.pathname !== '/'
    ? Number(parsed.pathname.slice(1))
    : undefined;
  return {
    host: parsed.hostname || '127.0.0.1',
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: Number.isFinite(db) ? db : undefined,
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}
