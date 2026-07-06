import { PrismaService } from '../../database/prisma.service';
export declare class HotspotService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateHotspots(): Promise<number>;
    getHotspots(limit?: number): Promise<any>;
}
