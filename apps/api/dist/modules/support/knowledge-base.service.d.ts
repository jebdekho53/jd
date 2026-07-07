import { PrismaService } from '../../database/prisma.service';
export declare class KnowledgeBaseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(query?: string, category?: string, audience?: string): Promise<{
        category: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        audience: import("@prisma/client").$Enums.SupportActorType;
        body: string;
        title: string;
        kind: import("@prisma/client").$Enums.HelpArticleKind;
        slug: string;
        sortOrder: number;
        isPublished: boolean;
    }[]>;
    getBySlug(slug: string): Promise<{
        category: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        audience: import("@prisma/client").$Enums.SupportActorType;
        body: string;
        title: string;
        kind: import("@prisma/client").$Enums.HelpArticleKind;
        slug: string;
        sortOrder: number;
        isPublished: boolean;
    } | null>;
    listCategories(audience?: string): Promise<string[]>;
}
