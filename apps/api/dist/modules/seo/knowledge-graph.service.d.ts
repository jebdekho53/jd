import { Prisma } from '@prisma/client';
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
        cities: {
            id: string;
            name: string;
            state: string;
            latitude: number;
            longitude: number;
            slug: string;
        }[];
        stores: {
            city: {
                name: string;
                slug: string;
            };
            id: string;
            name: string;
            ratingAvg: number;
            ratingCount: number;
            slug: string;
        }[];
        categories: {
            id: string;
            name: string;
            description: string | null;
            slug: string;
        }[];
        brands: {
            name: string | null;
            productCount: number;
        }[];
        faqs: {
            slug: string;
            question: string;
            answer: string;
        }[];
        entities: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            slug: string;
            entityType: import("@prisma/client").$Enums.SeoEntityType;
            entityId: string | null;
            relations: Prisma.JsonValue;
            knowledgeJson: Prisma.JsonValue | null;
            coverageScore: number;
        }[];
        deliveryCoverage: {
            city: string;
            slug: string;
            state: string;
        }[];
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
        entityCount: number;
        avgCoverage: number;
        citationsByEngine: (Prisma.PickEnumerable<Prisma.GeoMentionGroupByOutputType, "engine"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
}
