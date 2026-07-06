import { PrismaService } from '../../database/prisma.service';
export declare class KnowledgeBaseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(query?: string, category?: string, audience?: string): Promise<any>;
    getBySlug(slug: string): Promise<any>;
    listCategories(audience?: string): Promise<any>;
}
