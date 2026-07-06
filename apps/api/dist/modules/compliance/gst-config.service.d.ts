import { GstSlab } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class GstConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listTaxRates(): Promise<any>;
    listJurisdictions(): Promise<any>;
    listHsnCodes(query?: string): Promise<any>;
    ensureHsnCode(rawCode: string, gstSlab: GstSlab, description?: string): Promise<any>;
    updateProductTax(productId: string, storeId: string, data: {
        hsnCodeId?: string;
        gstSlab?: GstSlab;
        taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';
        taxInclusive?: boolean;
    }): Promise<any>;
}
