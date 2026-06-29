import { PrismaService } from '../../database/prisma.service';
export declare class AdminSupplyChainService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        activeVendors: number;
        activeOrders: number;
        pendingSettlements: number;
        inventoryShortages: number;
        topVendors: {
            id: string;
            businessName: string;
            ratingAvg: number;
            ratingCount: number;
            vendorType: import("@prisma/client").$Enums.VendorType;
        }[];
        creditRisk: ({
            merchantProfile: {
                businessName: string;
            };
            vendor: {
                businessName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            merchantProfileId: string;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            vendorId: string;
            usedLimit: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            overdueAmount: import("@prisma/client/runtime/library").Decimal;
        })[];
    }>;
    listVendors(): Promise<({
        _count: {
            orders: number;
            products: number;
        };
    } & {
        phone: string | null;
        email: string | null;
        id: string;
        createdAt: Date;
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
    })[]>;
    listVendorOrders(): Promise<({
        merchantProfile: {
            businessName: string;
        };
        vendor: {
            businessName: string;
        };
        invoice: {
            id: string;
            status: import("@prisma/client").$Enums.VendorInvoiceStatus;
            createdAt: Date;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date | null;
            invoiceNumber: string;
            dueDate: Date | null;
            vendorOrderId: string;
        } | null;
        shipment: {
            id: string;
            status: import("@prisma/client").$Enums.VendorShipmentStatus;
            createdAt: Date;
            deliveredAt: Date | null;
            trackingNumber: string | null;
            shippedAt: Date | null;
            carrier: string | null;
            vendorOrderId: string;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.VendorOrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string | null;
        orderNumber: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxAmount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        merchantProfileId: string;
        vendorId: string;
        creditUsed: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    listVendorSettlements(): Promise<({
        vendor: {
            businessName: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.VendorSettlementStatus;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
        periodStart: Date;
        periodEnd: Date;
        vendorId: string;
    })[]>;
}
