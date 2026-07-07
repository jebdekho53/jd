import { PrismaService } from '../../database/prisma.service';
export declare class FaqEngineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    seedDefaultFaqs(): Promise<void>;
    listFeatured(limit?: number): Promise<{
        category: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        cityId: string | null;
        slug: string;
        impressions: number;
        clicks: number;
        pageId: string | null;
        question: string;
        answer: string;
        featured: boolean;
        aeoScore: number;
    }[]>;
    generateFeaturedAnswer(question: string, context?: string): Promise<{
        answer: string;
        direct: boolean;
        snippet: string;
    }>;
    getAeoMetrics(): Promise<{
        total: number;
        featured: number;
        avgAeoScore: number;
        topFaqs: {
            category: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cityId: string | null;
            slug: string;
            impressions: number;
            clicks: number;
            pageId: string | null;
            question: string;
            answer: string;
            featured: boolean;
            aeoScore: number;
        }[];
    }>;
}
