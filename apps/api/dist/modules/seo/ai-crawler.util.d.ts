import { AiCrawlerType } from '@prisma/client';
export declare function detectCrawlerType(userAgent: string | undefined): AiCrawlerType | null;
export declare function parseEntityFromPath(path: string): {
    type: string;
    id?: string;
} | null;
