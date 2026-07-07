import { PrismaService } from '../../database/prisma.service';
import { CreateVendorOrderDto } from './dto/procurement.dto';
import { ProcurementCartService } from './procurement-cart.service';
export declare class ProcurementOrderService {
    private readonly prisma;
    private readonly cartService;
    constructor(prisma: PrismaService, cartService: ProcurementCartService);
    createOrder(userId: string, dto: CreateVendorOrderDto): Promise<{
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
    }>;
    listOrders(userId: string, storeId?: string): Promise<({
        vendor: {
            businessName: string;
            vendorType: import("@prisma/client").$Enums.VendorType;
        };
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
}
