import { PrismaService } from '../../database/prisma.service';
export declare class KnowledgeGraphService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    syncEntities(): Promise<number>;
    getPublicKnowledge(): Promise<{
        platform: {
            name: string;
            description: string;
        };
        plus: {
            name: string;
            benefits: string[];
        };
        cities: any;
        stores: any;
        categories: any;
        brands: any;
        faqs: any;
        entities: any;
        deliveryCoverage: any;
        generatedAt: string;
    }>;
    private upsertEntity;
    private syncPlatform;
    private syncPlus;
    private syncCities;
    private syncCategories;
    private syncStores;
    private syncBrands;
    getGeoMetrics(): Promise<{
        entityCount: any;
        avgCoverage: any;
        citationsByEngine: any;
    }>;
}
