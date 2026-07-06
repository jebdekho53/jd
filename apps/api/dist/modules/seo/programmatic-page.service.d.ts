import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
export declare class ProgrammaticPageService {
    private readonly prisma;
    private readonly siteUrl;
    constructor(prisma: PrismaService, config: ConfigService);
    syncAll(): Promise<number>;
    getPageByPath(path: string): Promise<any>;
    private upsertPage;
    private syncCityPages;
    private syncCityCategoryPages;
    private syncStorePages;
    private syncCategoryPages;
    private syncBrandPages;
}
