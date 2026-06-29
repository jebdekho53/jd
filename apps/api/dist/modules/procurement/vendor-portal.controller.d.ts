import { RequestUser } from '../../common/types';
import { VendorPortalService } from './vendor-portal.service';
import { CreateVendorProductDto, ShipVendorOrderDto } from './dto/procurement.dto';
export declare class VendorPortalController {
    private readonly vendor;
    constructor(vendor: VendorPortalService);
    orders(user: RequestUser): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
    ship(user: RequestUser, id: string, dto: ShipVendorOrderDto): Promise<{
        success: boolean;
        data: ({
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
        }) | null;
    }>;
    deliver(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: ({
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
        }) | null;
    }>;
    catalog(user: RequestUser): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
    createProduct(user: RequestUser, dto: CreateVendorProductDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
