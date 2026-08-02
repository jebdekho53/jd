import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { validationSchema } from './config/env.validation';
import { resolveEnvFilePaths } from './config/env-path';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { WebhooksModule } from './common/webhooks/webhooks.module';
import { AiCatalogWorkerModule } from './modules/ai-catalog/ai-catalog-worker.module';

/**
 * Root module for the standalone BullMQ worker process. Loads only what the AI
 * pipeline needs — config, Prisma, Redis, audit and the worker module (which
 * registers the processors). It never starts an HTTP server.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      validationSchema,
      validationOptions: { abortEarly: false },
      expandVariables: true,
    }),
    // The global DomainEventsModule (pulled in transitively via
    // RiderAssignmentModule -> ... -> ProductModule) needs EventEmitter2.
    // app.module.ts registers this for the API process; the worker has its
    // own root module and needs its own registration, or DomainEventsService
    // fails to resolve and the whole worker refuses to boot.
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      ignoreErrors: false,
    }),
    // Same story as EventEmitterModule above: the global WebhooksModule
    // (provides WebhookDedupService, needed by PaymentModule -> PaymentService)
    // is only imported by app.module.ts. No HTTP listener runs in this
    // process (see ai-catalog-worker.ts — createApplicationContext), so
    // WebhooksModule's controller is never actually routed; only its
    // provider registration matters here.
    WebhooksModule,
    PrismaModule,
    RedisModule,
    AuditModule,
    AiCatalogWorkerModule,
  ],
})
export class AiCatalogWorkerRootModule {}
