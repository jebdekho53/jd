import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/env.validation';
import { resolveEnvFilePaths } from './config/env-path';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
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
    PrismaModule,
    RedisModule,
    AuditModule,
    AiCatalogWorkerModule,
  ],
})
export class AiCatalogWorkerRootModule {}
