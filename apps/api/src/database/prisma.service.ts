import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');

    // Log slow queries in development
    if (process.env.NODE_ENV !== 'production') {
      (this.$on as any)('query', (event: { query: string; duration: number }) => {
        if (event.duration > 200) {
          this.logger.warn(`Slow query (${event.duration}ms): ${event.query}`);
        }
      });
    }

    (this.$on as any)('error', (event: { message: string; target: string }) => {
      this.logger.error(`DB error on ${event.target}: ${event.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }

  /**
   * Soft-delete helper — sets deletedAt on the record.
   * Call instead of prisma.model.delete() for entities that support soft deletes.
   */
  async softDelete<T extends { id: string }>(
    model: string,
    id: string,
  ): Promise<void> {
    await (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
