import { TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class TrustAlertService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    raise(alertType: TrustAlertType, severity: string, title: string, message: string, metadata?: Record<string, unknown>): Promise<any>;
    listOpen(limit?: number): Promise<any>;
    resolve(id: string): Promise<any>;
    checkFraudSpike(): Promise<void>;
}
