import { ConfigService } from '@nestjs/config';
import { SitemapType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class SitemapService {
    private readonly prisma;
    private readonly siteUrl;
    constructor(prisma: PrismaService, config: ConfigService);
    generateAll(): Promise<void>;
    getBrandsXml(): Promise<string>;
    getXml(type: SitemapType): Promise<string>;
    private generateType;
    private buildIndexXml;
    private buildProductsXml;
    private buildStoresXml;
    private buildCategoriesXml;
    private buildCitiesXml;
    private buildFaqXml;
    private wrapUrlset;
    private wrapSitemapIndex;
    private emptyUrlset;
    private escape;
}
