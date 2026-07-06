import { PrismaService } from '../../database/prisma.service';
export declare class RecommendationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRecommendations(userId: string, entityType: 'product' | 'store' | 'offer' | 'category', limit?: number): Promise<any>;
}
