import { PrismaService } from '../../database/prisma.service';
export declare class FaqEngineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    seedDefaultFaqs(): Promise<void>;
    listFeatured(limit?: number): Promise<any>;
    generateFeaturedAnswer(question: string, context?: string): Promise<{
        answer: any;
        direct: boolean;
        snippet: any;
    }>;
    getAeoMetrics(): Promise<{
        total: any;
        featured: any;
        avgAeoScore: any;
        topFaqs: any;
    }>;
}
