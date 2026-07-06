import { VerticalBusinessType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class VerticalService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    listStoreBusinessTypes(storeId: string): Promise<any>;
    setStoreBusinessTypes(storeId: string, types: VerticalBusinessType[], primary?: VerticalBusinessType): Promise<any>;
    approveStoreBusinessType(storeId: string, businessType: VerticalBusinessType, adminId: string): Promise<any>;
    rejectStoreBusinessType(storeId: string, businessType: VerticalBusinessType, adminId: string, reason: string): Promise<any>;
    syncApplicationBusinessTypes(applicationId: string, types: VerticalBusinessType[]): Promise<any>;
    copyApprovedTypesToStore(storeId: string, applicationId: string): Promise<any>;
    ensureStoreBusinessTypesFromApplication(storeId: string): Promise<any>;
    findStoresByVertical(businessType: VerticalBusinessType, opts?: {
        lat?: number;
        lng?: number;
        limit?: number;
        page?: number;
    }): Promise<any>;
}
