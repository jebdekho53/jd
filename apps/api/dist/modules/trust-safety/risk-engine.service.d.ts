import { RiskProfileStatus } from '@prisma/client';
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
    getOrCreateProfile(userId: string): Promise<any>;
    recordEvent(input: {
        userId?: string;
        eventType: string;
        severity: string;
        idempotencyKey: string;
        subjectType?: string;
        subjectId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<any>;
    recalculate(userId: string): Promise<RiskScores>;
    isBlocked(userId: string): Promise<boolean>;
    canUseCod(userId: string): Promise<boolean>;
}
