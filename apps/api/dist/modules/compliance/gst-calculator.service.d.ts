import { GstSlab, GstSupplyType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface GstLineInput {
    quantity: number;
    unitPrice: number;
    discount?: number;
    gstSlab: GstSlab;
    taxInclusive?: boolean;
}
export interface GstLineBreakdown {
    taxableAmount: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    lineTotal: number;
}
export interface GstTotals {
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    grandTotal: number;
}
export declare class GstCalculatorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    slabToPercent(slab: GstSlab): number;
    percentToSlab(percent: number): GstSlab;
    resolveSupplyType(supplierState: string, buyerState: string | null): GstSupplyType;
    getRatesForSlab(slab: GstSlab): Promise<{
        cgstRate: number;
        sgstRate: number;
        igstRate: number;
        totalRate: number;
    }>;
    computeLine(input: GstLineInput, supplyType: GstSupplyType, rates: {
        cgstRate: number;
        sgstRate: number;
        igstRate: number;
    }): GstLineBreakdown;
    sumLines(lines: GstLineBreakdown[]): GstTotals;
}
