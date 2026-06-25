import { Injectable } from '@nestjs/common';
import {
  FraudCaseCategory,
  FraudCaseStatus,
  FraudDecisionAction,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FraudCaseService {
  constructor(private readonly prisma: PrismaService) {}

  async openCase(input: {
    userId?: string;
    category: FraudCaseCategory;
    severity: string;
    title: string;
    description: string;
    subjectType?: string;
    subjectId?: string;
    idempotencyKey: string;
  }) {
    const existing = await this.prisma.fraudCase.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;

    const count = await this.prisma.fraudCase.count();
    const caseNumber = `JD-FRD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.fraudCase.create({
      data: {
        caseNumber,
        userId: input.userId,
        category: input.category,
        severity: input.severity,
        title: input.title,
        description: input.description,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        idempotencyKey: input.idempotencyKey,
      },
    });
  }

  async recordDecision(input: {
    fraudCaseId?: string;
    fraudRuleId?: string;
    userId?: string;
    decision: FraudDecisionAction;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
    actionTaken?: boolean;
  }) {
    const existing = await this.prisma.fraudDecision.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;

    return this.prisma.fraudDecision.create({
      data: {
        fraudCaseId: input.fraudCaseId,
        fraudRuleId: input.fraudRuleId,
        userId: input.userId,
        decision: input.decision,
        actionTaken: input.actionTaken ?? false,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listCases(category?: FraudCaseCategory, status?: FraudCaseStatus, page = 1, limit = 20) {
    const where: Prisma.FraudCaseWhereInput = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.fraudCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fraudCase.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async resolveCase(caseId: string, adminUserId: string, resolution: string, dismiss = false) {
    return this.prisma.fraudCase.update({
      where: { id: caseId },
      data: {
        status: dismiss ? FraudCaseStatus.DISMISSED : FraudCaseStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: adminUserId,
        resolution,
      },
    });
  }
}
