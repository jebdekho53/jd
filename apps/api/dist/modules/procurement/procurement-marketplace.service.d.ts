import { PrismaService } from '../../database/prisma.service';
import { ProcurementQueryDto } from './dto/procurement.dto';
export declare class ProcurementMarketplaceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchVendors(query: ProcurementQueryDto): Promise<any>;
    searchProducts(query: ProcurementQueryDto): Promise<any>;
    getCreditLines(merchantProfileId: string): Promise<any>;
}
