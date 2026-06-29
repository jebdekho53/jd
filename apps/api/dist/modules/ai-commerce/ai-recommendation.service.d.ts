import { PrismaService } from '../../database/prisma.service';
export declare class AIRecommendationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateForStore(storeId: string): Promise<void>;
    generateAll(): Promise<void>;
    getForMerchant(storeIds: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        priority: import("@prisma/client").$Enums.AIRecommendationPriority;
        entityType: import("@prisma/client").$Enums.AIRecommendationEntityType;
        entityId: string;
    }[]>;
    getAdminRecommendations(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        priority: import("@prisma/client").$Enums.AIRecommendationPriority;
        entityType: import("@prisma/client").$Enums.AIRecommendationEntityType;
        entityId: string;
    }[]>;
    private upsertRecommendation;
}
