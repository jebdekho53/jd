import { Injectable } from '@nestjs/common';
import { MarketingEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface TrackEventInput {
  userId?: string;
  eventType: MarketingEventType;
  sessionId?: string;
  storeId?: string;
  productId?: string;
  orderId?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class MarketingEventService {
  constructor(private readonly prisma: PrismaService) {}

  async track(input: TrackEventInput) {
    const event = await this.prisma.marketingEvent.create({
      data: {
        userId: input.userId,
        eventType: input.eventType,
        sessionId: input.sessionId,
        storeId: input.storeId,
        productId: input.productId,
        orderId: input.orderId,
        metadata: input.metadata,
      },
    });

    if (input.userId) {
      void this.updateAffinities(input);
    }

    return event;
  }

  private async updateAffinities(input: TrackEventInput) {
    if (!input.userId) return;
    const scoreBump = 1;

    if (input.productId) {
      await this.prisma.customerAffinity.upsert({
        where: {
          userId_affinityType_entityType_entityId: {
            userId: input.userId,
            affinityType: 'PRODUCT',
            entityType: 'product',
            entityId: input.productId,
          },
        },
        create: {
          userId: input.userId,
          affinityType: 'PRODUCT',
          entityType: 'product',
          entityId: input.productId,
          score: scoreBump,
        },
        update: { score: { increment: scoreBump } },
      });
    }

    if (input.storeId) {
      await this.prisma.customerAffinity.upsert({
        where: {
          userId_affinityType_entityType_entityId: {
            userId: input.userId,
            affinityType: 'STORE',
            entityType: 'store',
            entityId: input.storeId,
          },
        },
        create: {
          userId: input.userId,
          affinityType: 'STORE',
          entityType: 'store',
          entityId: input.storeId,
          score: scoreBump,
        },
        update: { score: { increment: scoreBump } },
      });
    }
  }
}
