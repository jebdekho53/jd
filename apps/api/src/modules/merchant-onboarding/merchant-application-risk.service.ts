import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface RiskAssessment {
  riskScore: number;
  riskFlags: string[];
}

@Injectable()
export class MerchantApplicationRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async assess(input: {
    userId: string;
    ownerPhone?: string | null;
    ownerEmail?: string | null;
    gstNumber?: string | null;
    panNumber?: string | null;
    accountNumber?: string | null;
    applicationId?: string;
  }): Promise<RiskAssessment> {
    const flags: string[] = [];
    let riskScore = 0;

    const checks: Array<Promise<void>> = [];

    if (input.gstNumber) {
      checks.push(
        this.prisma.merchantProfile
          .findFirst({
            where: {
              gstNumber: input.gstNumber,
              ...(input.applicationId && {
                merchantApplication: { id: { not: input.applicationId } },
              }),
            },
          })
          .then((dup) => {
            if (dup) {
              flags.push('DUPLICATE_GST');
              riskScore += 40;
            }
          }),
      );
    }

    if (input.panNumber) {
      checks.push(
        this.prisma.merchantProfile
          .findFirst({
            where: {
              panNumber: input.panNumber,
              ...(input.applicationId && {
                merchantApplication: { id: { not: input.applicationId } },
              }),
            },
          })
          .then((dup) => {
            if (dup) {
              flags.push('DUPLICATE_PAN');
              riskScore += 35;
            }
          }),
      );
    }

    if (input.ownerPhone) {
      checks.push(
        this.prisma.user
          .findFirst({
            where: {
              phone: input.ownerPhone,
              id: { not: input.userId },
              merchantProfile: { isNot: null },
            },
          })
          .then((dup) => {
            if (dup) {
              flags.push('DUPLICATE_MOBILE');
              riskScore += 30;
            }
          }),
      );
    }

    if (input.ownerEmail) {
      checks.push(
        this.prisma.user
          .findFirst({
            where: {
              email: input.ownerEmail,
              id: { not: input.userId },
              merchantProfile: { isNot: null },
            },
          })
          .then((dup) => {
            if (dup) {
              flags.push('DUPLICATE_EMAIL');
              riskScore += 25;
            }
          }),
      );
    }

    if (input.accountNumber) {
      checks.push(
        this.prisma.merchantBankAccount
          .findFirst({
            where: {
              accountNumber: input.accountNumber,
              ...(input.applicationId && { applicationId: { not: input.applicationId } }),
            },
          })
          .then((dup) => {
            if (dup) {
              flags.push('DUPLICATE_BANK_ACCOUNT');
              riskScore += 35;
            }
          }),
      );
    }

    const deviceCount = await this.prisma.deviceFingerprint.count({
      where: { userId: input.userId },
    });
    if (deviceCount > 3) {
      flags.push('MULTIPLE_DEVICES');
      riskScore += 10;
    }

    await Promise.all(checks);

    return {
      riskScore: Math.min(100, riskScore),
      riskFlags: flags,
    };
  }

  flagsToJson(flags: string[]): Prisma.InputJsonValue {
    return flags as unknown as Prisma.InputJsonValue;
  }
}
