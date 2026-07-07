import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProcurementQueryDto } from './dto/procurement.dto';
export declare class ProcurementMarketplaceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchVendors(query: ProcurementQueryDto): Promise<{
        city: {
            name: string;
        } | null;
        id: string;
        _count: {
            products: number;
        };
        businessName: string;
        gstNumber: string | null;
        ratingAvg: number;
        ratingCount: number;
        vendorType: import("@prisma/client").$Enums.VendorType;
    }[]>;
    searchProducts(query: ProcurementQueryDto): Promise<({
        inventory: {
            availableQty: number;
        } | null;
        vendor: {
            id: string;
            businessName: string;
            ratingAvg: number;
            vendorType: import("@prisma/client").$Enums.VendorType;
        };
        priceTiers: {
            id: string;
            unitPrice: Prisma.Decimal;
            vendorProductId: string;
            minQty: number;
            maxQty: number | null;
        }[];
    } & {
        category: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        sku: string;
        unit: string;
        basePrice: Prisma.Decimal;
        hsnCode: string | null;
        gstRate: number;
        vendorId: string;
        catalogId: string;
        moq: number;
        leadTimeDays: number;
    })[]>;
    getCreditLines(merchantProfileId: string): Promise<{
        creditLimit: number;
        usedLimit: number;
        availableLimit: number;
        overdueAmount: number;
        vendor: {
            businessName: string;
            vendorType: import("@prisma/client").$Enums.VendorType;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        merchantProfileId: string;
        vendorId: string;
        dueDate: Date | null;
    }[]>;
}
