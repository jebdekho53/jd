import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AiCatalogWorkerRootModule } from './ai-catalog-worker.module';

/**
 * Standalone AI Catalog worker entry point (PM2 / `pnpm worker:ai-catalog`).
 * Runs the BullMQ processors in their own process, isolated from the API. Uses
 * a Nest application *context* (no HTTP listener). Shutdown hooks let BullMQ
 * drain in-flight jobs and close Redis connections cleanly on SIGTERM/SIGINT so
 * a deploy never kills a job mid-flight (it is re-queued instead).
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('AiCatalogWorker');
  const app = await NestFactory.createApplicationContext(AiCatalogWorkerRootModule, {
    bufferLogs: false,
  });
  app.enableShutdownHooks();

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Received ${signal}, draining AI catalog workers…`);
    try {
      await app.close(); // triggers @nestjs/bullmq worker.close() → waits for active jobs
      logger.log('AI catalog workers drained and closed');
      process.exit(0);
    } catch (e) {
      logger.error(`Error during shutdown: ${(e as Error).message}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection in worker: ${String(reason)}`);
  });

  logger.log('AI Catalog worker process started (queues: analysis, image, retry, moderation)');
}

void bootstrap();
