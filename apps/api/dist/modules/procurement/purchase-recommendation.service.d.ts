import { PrismaService } from '../../database/prisma.service';
export declare class PurchaseRecommendationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateForMerchant(merchantProfileId: string, storeId?: string): Promise<any[]>;
    listRecommendations(merchantProfileId: string, storeId?: string): Promise<any>;
    private resolveAlertType;
}
