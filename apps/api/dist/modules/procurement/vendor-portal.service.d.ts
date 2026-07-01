import { PrismaService } from '../../database/prisma.service';
import { CreateVendorProductDto, ShipVendorOrderDto } from './dto/procurement.dto';
export declare class VendorPortalService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveVendorId(userId: string): Promise<string>;
    listOrders(userId: string): Promise<({
        items: {
            id: string;
            productName: string;
            sku: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            vendorProductId: string;
            vendorOrderId: string;
        }[];
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
    shipOrder(userId: string, orderId: string, dto: ShipVendorOrderDto): Promise<({
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
    }) | null>;
    deliverOrder(userId: string, orderId: string): Promise<({
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
    }) | null>;
    getCatalog(userId: string): Promise<({
        products: ({
            inventory: {
                id: string;
                updatedAt: Date;
                availableQty: number;
                reservedQty: number;
                vendorProductId: string;
            } | null;
            priceTiers: {
                id: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
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
            basePrice: import("@prisma/client/runtime/library").Decimal;
            hsnCode: string | null;
            gstRate: number;
            vendorId: string;
            catalogId: string;
            moq: number;
            leadTimeDays: number;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        vendorId: string;
    })[]>;
    createProduct(userId: string, dto: CreateVendorProductDto): Promise<{
        inventory: {
            id: string;
            updatedAt: Date;
            availableQty: number;
            reservedQty: number;
            vendorProductId: string;
        } | null;
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
    }>;
}
