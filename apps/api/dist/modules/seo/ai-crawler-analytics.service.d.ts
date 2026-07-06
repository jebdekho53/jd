import { PrismaService } from '../../database/prisma.service';
export declare class AiCrawlerAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordVisit(input: {
        userAgent?: string;
        path: string;
        ipAddress?: string;
    }): Promise<any>;
    getMetrics(sinceDays?: number): Promise<{
        total: any;
        byType: any;
        topPaths: any;
        indexedEntities: any;
    }>;
    getCrawlHealth(): Promise<{
        visitsLast24h: any;
        activeAiEngines: any;
        health: string;
    }>;
}
