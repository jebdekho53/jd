import { PrismaService } from '../../database/prisma.service';
export declare class AiCrawlerAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordVisit(input: {
        userAgent?: string;
        path: string;
        ipAddress?: string;
    }): Promise<{
        path: string;
        id: string;
        ipAddress: string | null;
        createdAt: Date;
        crawlerUserAgent: string;
        crawlerType: import("@prisma/client").$Enums.AiCrawlerType;
        indexedEntityType: string | null;
        indexedEntityId: string | null;
    } | null>;
    getMetrics(sinceDays?: number): Promise<{
        total: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AiCrawlerVisitGroupByOutputType, "crawlerType"[]> & {
            _count: {
                id: number;
            };
        })[];
        topPaths: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AiCrawlerVisitGroupByOutputType, "path"[]> & {
            _count: {
                id: number;
            };
        })[];
        indexedEntities: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AiCrawlerVisitGroupByOutputType, "indexedEntityType"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    getCrawlHealth(): Promise<{
        visitsLast24h: number;
        activeAiEngines: number;
        health: string;
    }>;
}
