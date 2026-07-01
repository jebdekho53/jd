import { GstSlab } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class GstConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listTaxRates(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        slab: import("@prisma/client").$Enums.GstSlab;
        cgstRate: import("@prisma/client/runtime/library").Decimal;
        sgstRate: import("@prisma/client/runtime/library").Decimal;
        igstRate: import("@prisma/client/runtime/library").Decimal;
        totalRate: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    listJurisdictions(): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        stateCode: string;
        stateName: string;
    }[]>;
    listHsnCodes(query?: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        code: string;
        isActive: boolean;
        defaultGstSlab: import("@prisma/client").$Enums.GstSlab;
    }[]>;
    ensureHsnCode(rawCode: string, gstSlab: GstSlab, description?: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        code: string;
        isActive: boolean;
        defaultGstSlab: import("@prisma/client").$Enums.GstSlab;
    }>;
    updateProductTax(productId: string, storeId: string, data: {
        hsnCodeId?: string;
        gstSlab?: GstSlab;
        taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';
        taxInclusive?: boolean;
    }): Promise<({
        hsnCodeRef: {
            id: string;
            createdAt: Date;
            description: string;
            code: string;
            isActive: boolean;
            defaultGstSlab: import("@prisma/client").$Enums.GstSlab;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        storeId: string;
        categoryId: string | null;
        isActive: boolean;
        slug: string;
        sku: string | null;
        tags: string[];
        sortOrder: number;
        unit: string;
        brand: string | null;
        isReturnable: boolean;
        isRefundable: boolean;
        isReplaceable: boolean;
        returnWindowHours: number | null;
        approvalMode: import("@prisma/client").$Enums.ClaimApprovalMode;
        proofRequired: import("@prisma/client").$Enums.ClaimProofRequirement;
        autoApproveBelowAmount: import("@prisma/client/runtime/library").Decimal | null;
        returnReasons: import("@prisma/client").$Enums.ReturnClaimReason[];
        restockingFee: import("@prisma/client/runtime/library").Decimal;
        refundMethod: import("@prisma/client").$Enums.ClaimRefundMethod;
        returnPolicyText: string | null;
        replacementPolicyText: string | null;
        preparedFoodPolicy: import("@prisma/client").$Enums.PreparedFoodPolicy | null;
        allowCustomerChangedMind: boolean;
        imageUrls: string[];
        basePrice: import("@prisma/client/runtime/library").Decimal;
        mrp: import("@prisma/client/runtime/library").Decimal | null;
        weightGrams: number | null;
        isVeg: boolean | null;
        hsnCodeId: string | null;
        gstSlab: import("@prisma/client").$Enums.GstSlab | null;
        taxCategory: import("@prisma/client").$Enums.ProductTaxCategory;
        taxInclusive: boolean;
        ingredients: string | null;
        shelfLife: string | null;
        countryOfOrigin: string | null;
        manufacturerName: string | null;
        manufacturerAddress: string | null;
        fssaiLicense: string | null;
        storageInstructions: string | null;
        disclaimer: string | null;
    }) | null>;
}
