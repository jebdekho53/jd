import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { AddCartItemDto, UpdateCartDto } from './dto/procurement.dto';
export declare class ProcurementCartService {
    private readonly prisma;
    private readonly merchantDashboard;
    constructor(prisma: PrismaService, merchantDashboard: MerchantDashboardService);
    getCart(userId: string, storeId?: string): Promise<{
        items: ({
            vendorProduct: {
                inventory: {
                    id: string;
                    updatedAt: Date;
                    availableQty: number;
                    reservedQty: number;
                    vendorProductId: string;
                } | null;
                vendor: {
                    id: string;
                    createdAt: Date;
                    email: string | null;
                    phone: string | null;
                    updatedAt: Date;
                    businessName: string;
                    gstNumber: string | null;
                    panNumber: string | null;
                    isActive: boolean;
                    ratingAvg: number;
                    ratingCount: number;
                    latitude: number | null;
                    longitude: number | null;
                    cityId: string | null;
                    line1: string | null;
                    pincode: string | null;
                    vendorType: import("@prisma/client").$Enums.VendorType;
                    serviceRadiusKm: number;
                };
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
                basePrice: import("@prisma/client/runtime/library").Decimal;
                hsnCode: string | null;
                gstRate: number;
                vendorId: string;
                catalogId: string;
                moq: number;
                leadTimeDays: number;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            cartId: string;
            vendorProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string | null;
        merchantProfileId: string;
        vendorId: string | null;
    }>;
    updateCart(userId: string, dto: UpdateCartDto): Promise<{
        items: ({
            vendorProduct: {
                inventory: {
                    id: string;
                    updatedAt: Date;
                    availableQty: number;
                    reservedQty: number;
                    vendorProductId: string;
                } | null;
                vendor: {
                    id: string;
                    createdAt: Date;
                    email: string | null;
                    phone: string | null;
                    updatedAt: Date;
                    businessName: string;
                    gstNumber: string | null;
                    panNumber: string | null;
                    isActive: boolean;
                    ratingAvg: number;
                    ratingCount: number;
                    latitude: number | null;
                    longitude: number | null;
                    cityId: string | null;
                    line1: string | null;
                    pincode: string | null;
                    vendorType: import("@prisma/client").$Enums.VendorType;
                    serviceRadiusKm: number;
                };
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
                basePrice: import("@prisma/client/runtime/library").Decimal;
                hsnCode: string | null;
                gstRate: number;
                vendorId: string;
                catalogId: string;
                moq: number;
                leadTimeDays: number;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            cartId: string;
            vendorProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string | null;
        merchantProfileId: string;
        vendorId: string | null;
    }>;
    addItem(userId: string, dto: AddCartItemDto, storeId?: string): Promise<{
        items: ({
            vendorProduct: {
                inventory: {
                    id: string;
                    updatedAt: Date;
                    availableQty: number;
                    reservedQty: number;
                    vendorProductId: string;
                } | null;
                vendor: {
                    id: string;
                    createdAt: Date;
                    email: string | null;
                    phone: string | null;
                    updatedAt: Date;
                    businessName: string;
                    gstNumber: string | null;
                    panNumber: string | null;
                    isActive: boolean;
                    ratingAvg: number;
                    ratingCount: number;
                    latitude: number | null;
                    longitude: number | null;
                    cityId: string | null;
                    line1: string | null;
                    pincode: string | null;
                    vendorType: import("@prisma/client").$Enums.VendorType;
                    serviceRadiusKm: number;
                };
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
                basePrice: import("@prisma/client/runtime/library").Decimal;
                hsnCode: string | null;
                gstRate: number;
                vendorId: string;
                catalogId: string;
                moq: number;
                leadTimeDays: number;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            cartId: string;
            vendorProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string | null;
        merchantProfileId: string;
        vendorId: string | null;
    }>;
    private resolveMerchant;
}
