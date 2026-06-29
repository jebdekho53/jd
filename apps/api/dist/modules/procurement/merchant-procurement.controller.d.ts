import { RequestUser } from '../../common/types';
import { PurchaseRecommendationService } from './purchase-recommendation.service';
import { ProcurementMarketplaceService } from './procurement-marketplace.service';
import { ProcurementCartService } from './procurement-cart.service';
import { ProcurementOrderService } from './procurement-order.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';
import { AddCartItemDto, CreateVendorOrderDto, ProcurementQueryDto, UpdateCartDto } from './dto/procurement.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class MerchantProcurementController {
    private readonly recommendations;
    private readonly marketplace;
    private readonly cart;
    private readonly orders;
    private readonly analytics;
    private readonly prisma;
    constructor(recommendations: PurchaseRecommendationService, marketplace: ProcurementMarketplaceService, cart: ProcurementCartService, orders: ProcurementOrderService, analytics: ProcurementAnalyticsService, prisma: PrismaService);
    private merchantId;
    getRecommendations(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            storeId: string | null;
            alertType: import("@prisma/client").$Enums.ProcurementAlertType;
            merchantProfileId: string;
            productName: string;
            sku: string;
            recommendedQty: number;
            vendorProductId: string | null;
            currentStock: number;
            avgDailySales: number;
            predictedOosDays: number;
            suggestedVendorId: string | null;
            expectedRevenueImpact: import("@prisma/client/runtime/library").Decimal;
            isDismissed: boolean;
        }[];
    }>;
    vendors(query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    products(query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: ({
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
    }>;
    credit(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    getCart(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateCart(user: RequestUser, dto: UpdateCartDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    addCartItem(user: RequestUser, dto: AddCartItemDto, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    createOrder(user: RequestUser, dto: CreateVendorOrderDto): Promise<{
        success: boolean;
        data: {
            vendor: {
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
        };
    }>;
    listOrders(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: ({
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
    getAnalytics(user: RequestUser, query: ProcurementQueryDto): Promise<{
        success: boolean;
        data: {};
    }>;
}
