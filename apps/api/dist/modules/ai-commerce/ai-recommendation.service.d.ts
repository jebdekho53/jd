import { PrismaService } from '../../database/prisma.service';
export declare class AIRecommendationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateForStore(storeId: string): Promise<void>;
    generateAll(): Promise<void>;
    getForMerchant(storeIds: string[]): Promise<any>;
    getAdminRecommendations(): Promise<any>;
    private upsertRecommendation;
}
