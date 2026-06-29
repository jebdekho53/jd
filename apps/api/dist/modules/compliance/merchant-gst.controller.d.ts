import { Response } from 'express';
import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from './compliance.service';
import { GstConfigService } from './gst-config.service';
import { ComplianceExportService } from './compliance-export.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { ExportComplianceQueryDto, ListComplianceQueryDto, UpdateProductTaxDto } from './dto/compliance.dto';
export declare class MerchantGstController {
    private readonly prisma;
    private readonly compliance;
    private readonly config;
    private readonly exports;
    private readonly invoices;
    constructor(prisma: PrismaService, compliance: ComplianceService, config: GstConfigService, exports: ComplianceExportService, invoices: InvoiceEngineService);
    private merchantProfileId;
    overview(user: RequestUser, month?: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            summary: {
                invoiceCount: number;
                taxableSales: number;
                gstCollected: number;
                grossTotal: number;
            };
            recentInvoices: {
                id: string;
                invoiceNumber: string;
                orderNumber: string;
                grandTotal: number;
                invoiceDate: Date;
            }[];
            tds: {
                records: {
                    periodMonth: string;
                    taxableAmount: number;
                    tdsRate: number;
                    tdsAmount: number;
                }[];
                totalTds: number;
            };
        };
        message?: undefined;
    }>;
    listInvoices(user: RequestUser, query: ListComplianceQueryDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            items: {
                id: string;
                invoiceNumber: string;
                orderNumber: string;
                grandTotal: number;
                totalTax: number;
                invoiceDate: Date;
            }[];
            total: number;
            page: number;
            limit: number;
        };
        message?: undefined;
    }>;
    invoicePdf(user: RequestUser, id: string, res: Response): Promise<void>;
    exportSummary(user: RequestUser, query: ExportComplianceQueryDto, res: Response): Promise<void>;
    hsn(q?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            description: string;
            code: string;
            isActive: boolean;
            defaultGstSlab: import("@prisma/client").$Enums.GstSlab;
        }[];
    }>;
    updateProductTax(user: RequestUser, productId: string, dto: UpdateProductTaxDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
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
        };
        message?: undefined;
    }>;
}
