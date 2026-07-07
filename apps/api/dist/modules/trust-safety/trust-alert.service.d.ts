import { Prisma, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class TrustAlertService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    raise(alertType: TrustAlertType, severity: string, title: string, message: string, metadata?: Record<string, unknown>): Promise<{
        message: string;
        id: string;
        status: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        severity: string;
        title: string;
        resolvedAt: Date | null;
        alertType: import("@prisma/client").$Enums.TrustAlertType;
    }>;
    listOpen(limit?: number): Promise<{
        message: string;
        id: string;
        status: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        severity: string;
        title: string;
        resolvedAt: Date | null;
        alertType: import("@prisma/client").$Enums.TrustAlertType;
    }[]>;
    resolve(id: string): Promise<{
        message: string;
        id: string;
        status: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        severity: string;
        title: string;
        resolvedAt: Date | null;
        alertType: import("@prisma/client").$Enums.TrustAlertType;
    }>;
    checkFraudSpike(): Promise<void>;
}
