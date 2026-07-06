import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { OpenAiVisionClient } from '../product/openai-vision.client';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { MenuService } from './menu.service';
export declare class MenuOcrService {
    private readonly prisma;
    private readonly vision;
    private readonly menu;
    private readonly categoryAccess;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, vision: OpenAiVisionClient, menu: MenuService, categoryAccess: StoreCategoryAccessService, config: ConfigService);
    uploadMenuForOcr(merchantProfileId: string, storeId: string, imageUrl: string): Promise<any>;
    private processJob;
    publishDraftMenu(merchantProfileId: string, storeId: string, jobId: string): Promise<any>;
    getJob(merchantProfileId: string, storeId: string, jobId: string): Promise<any>;
}
