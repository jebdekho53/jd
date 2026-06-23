import { Injectable, Logger } from '@nestjs/common';
import { DomainEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type DomainEventPayload = Prisma.InputJsonValue;
export type DomainEventMetadata = Prisma.InputJsonValue;

@Injectable()
export class DomainEventsService {
  private readonly logger = new Logger(DomainEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a domain event to the domain_events table.
   *
   * In Phase 1, events are written directly.
   * Phase 2 upgrade path: outbox pattern — write in same DB transaction,
   * consume with a dedicated worker process.
   */
  async emit(
    eventType: DomainEventType,
    aggregateType: string,
    aggregateId: string,
    payload: DomainEventPayload,
    metadata?: DomainEventMetadata,
  ): Promise<string> {
    try {
      const event = await this.prisma.domainEvent.create({
        data: {
          eventType,
          aggregateType,
          aggregateId,
          payload: payload ?? Prisma.JsonNull,
          metadata: metadata ?? Prisma.JsonNull,
        },
        select: { id: true },
      });

      this.logger.debug(
        { eventType, aggregateType, aggregateId, eventId: event.id },
        'Domain event emitted',
      );

      return event.id;
    } catch (err) {
      // Domain event failures must NOT break the main business transaction.
      // Log the error but do not re-throw.
      this.logger.error(
        { err, eventType, aggregateType, aggregateId },
        'Failed to persist domain event',
      );
      return '';
    }
  }

  /**
   * Mark a domain event as processed (used by future async consumers).
   */
  async markProcessed(eventId: string): Promise<void> {
    await this.prisma.domainEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date() },
    });
  }

  /**
   * Fetch unprocessed events for a given type (useful for replay / consumer workers).
   */
  async getUnprocessed(
    eventType: DomainEventType,
    limit = 100,
  ): Promise<Array<{ id: string; aggregateId: string; payload: unknown }>> {
    return this.prisma.domainEvent.findMany({
      where: { eventType, processedAt: null },
      orderBy: { occurredAt: 'asc' },
      take: limit,
      select: { id: true, aggregateId: true, payload: true },
    });
  }
}
