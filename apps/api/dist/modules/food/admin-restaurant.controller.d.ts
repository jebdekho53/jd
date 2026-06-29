import { VerticalBusinessType } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { VerticalService } from './vertical.service';
import { RestaurantDiscoveryService } from './restaurant-discovery.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminRestaurantController {
    private readonly vertical;
    private readonly discovery;
    private readonly prisma;
    constructor(vertical: VerticalService, discovery: RestaurantDiscoveryService, prisma: PrismaService);
    pendingApprovals(page?: number): Promise<{
        success: boolean;
        data: ({
            store: {
                id: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                name: string;
                slug: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            rejectionReason: string | null;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            businessType: import("@prisma/client").$Enums.VerticalBusinessType;
            isPrimary: boolean;
        })[];
    }>;
    approveType(user: RequestUser, storeId: string, businessType: VerticalBusinessType): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            rejectionReason: string | null;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            businessType: import("@prisma/client").$Enums.VerticalBusinessType;
            isPrimary: boolean;
        };
    }>;
    rejectType(user: RequestUser, storeId: string, businessType: VerticalBusinessType, reason: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.StoreBusinessTypeStatus;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            rejectionReason: string | null;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            businessType: import("@prisma/client").$Enums.VerticalBusinessType;
            isPrimary: boolean;
        };
    }>;
    listCuisines(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            imageUrl: string | null;
        }[];
    }>;
    foodOrderAnalytics(days?: number): Promise<{
        success: boolean;
        data: {
            totalOrders: number;
            revenue: number;
            byStatus: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.OrderGroupByOutputType, "status"[]> & {
                _count: number;
            })[];
        };
    }>;
    popularDishes(limit?: number): Promise<{
        success: boolean;
        data: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.FoodOrderItemGroupByOutputType, "itemName"[]> & {
            _sum: {
                quantity: number | null;
            };
        })[];
    }>;
    pendingFoodCheckouts(page?: number): Promise<{
        success: boolean;
        data: {
            items: ({
                buyerProfile: {
                    user: {
                        phone: string;
                    };
                    id: string;
                    name: string;
                };
            } & {
                idempotencyKey: string | null;
                id: string;
                status: string;
                createdAt: Date;
                expiresAt: Date;
                updatedAt: Date;
                storeId: string;
                buyerProfileId: string;
                deliveryAddress: import("@prisma/client/runtime/library").JsonValue;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                deliveryLat: number;
                deliveryLng: number;
                couponId: string | null;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                deliveryFee: import("@prisma/client/runtime/library").Decimal;
                taxAmount: import("@prisma/client/runtime/library").Decimal;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                packagingFee: import("@prisma/client/runtime/library").Decimal;
                tipAmount: import("@prisma/client/runtime/library").Decimal;
                scheduledDeliveryAt: Date | null;
                specialInstructions: string | null;
                restaurantNote: string | null;
                orderId: string | null;
                razorpayOrderId: string | null;
                cartSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
            total: number;
            page: number;
        };
    }>;
    foodOrdersOverview(): Promise<{
        success: boolean;
        data: {
            pendingOnlineCheckouts: number;
            paidAwaitingKitchen: number;
            codActive: number;
            failedOrCancelled: number;
            readyForPickup: number;
            shadowfaxShipments: number;
        };
    }>;
}
