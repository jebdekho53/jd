import { PrismaService } from '../../database/prisma.service';
export declare class FraudService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    flagSelfReferral(walletId: string): Promise<any>;
    flagDuplicateDevice(walletId: string, fingerprint: string): Promise<any>;
    flagSuspiciousCredit(walletId: string, amount: number, metadata?: Record<string, unknown>): Promise<any>;
    private createReview;
    listPendingReviews(limit?: number): Promise<any>;
    resolveReview(reviewId: string, adminUserId: string, approve: boolean): Promise<any>;
}
