import { Prisma, RiskProfileStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface RiskScores {
    riskScore: number;
    trustScore: number;
    fraudScore: number;
    status: RiskProfileStatus;
}
export declare class RiskEngineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrCreateProfile(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.RiskProfileStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        riskScore: number;
        trustScore: number;
        fraudScore: number;
        codEnabled: boolean;
        walletFrozen: boolean;
        referralFrozen: boolean;
        couponFrozen: boolean;
        lastEvaluatedAt: Date | null;
    }>;
    recordEvent(input: {
        userId?: string;
        eventType: string;
        severity: string;
        idempotencyKey: string;
        subjectType?: string;
        subjectId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<{
        idempotencyKey: string;
        id: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        eventType: string;
        userId: string | null;
        severity: string;
        subjectType: string | null;
        subjectId: string | null;
    }>;
    recalculate(userId: string): Promise<RiskScores>;
    isBlocked(userId: string): Promise<boolean>;
    canUseCod(userId: string): Promise<boolean>;
}
