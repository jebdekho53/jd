import { Injectable, Logger } from '@nestjs/common';
import { Prisma, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TrustAlertService {
  private readonly logger = new Logger(TrustAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async raise(
    alertType: TrustAlertType,
    severity: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const recent = await this.prisma.trustAlert.findFirst({
      where: {
        alertType,
        status: 'OPEN',
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
    });
    if (recent) return recent;

    return this.prisma.trustAlert.create({
      data: {
        alertType,
        severity,
        title,
        message,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listOpen(limit = 50) {
    return this.prisma.trustAlert.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async resolve(id: string) {
    return this.prisma.trustAlert.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  async checkFraudSpike() {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.fraudCase.count({
      where: { createdAt: { gte: hourAgo }, status: 'OPEN' },
    });
    if (count >= 10) {
      await this.raise(
        TrustAlertType.FRAUD_SPIKE,
        'CRITICAL',
        'Fraud case spike',
        `${count} new fraud cases in the last hour.`,
        { count },
      );
    }
  }
}
