import { PrismaService } from '../../database/prisma.service';
export declare class RecommendationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRecommendations(userId: string, entityType: 'product' | 'store' | 'offer' | 'category', limit?: number): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        reason: string | null;
        entityType: string;
        entityId: string;
        score: number;
    }[] | {
        entityType: string;
        entityId: string;
        score: number;
        reason: string;
    }[]>;
}
