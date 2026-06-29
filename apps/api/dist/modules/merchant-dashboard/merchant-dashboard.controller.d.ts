import { RequestUser } from '../../common/types';
import { MerchantDashboardService } from './merchant-dashboard.service';
import { MerchantDashboardAnalyticsQueryDto, MerchantDashboardOrdersQueryDto, MerchantDashboardStoreQueryDto } from './dto/merchant-dashboard-query.dto';
export declare class MerchantDashboardController {
    private readonly dashboard;
    constructor(dashboard: MerchantDashboardService);
    getOverview(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            todayOrders: number;
            todayRevenue: number;
            pendingOrders: number;
            preparingOrders: number;
            packingOrders: number;
            readyForPickup: number;
            deliveredToday: number;
            cancelledOrders: number;
            avgOrderValue: number;
            customerRating: number;
            ratingCount: number;
            growth: {
                ordersPct: number;
                revenuePct: number;
            };
            sparkline: {
                date: string;
                value: number;
            }[];
        };
    }>;
    getOrders(user: RequestUser, query: MerchantDashboardOrdersQueryDto): Promise<{
        success: boolean;
        data: {
            orders: {
                id: string;
                orderNumber: string;
                customerName: string;
                customerPhone: string;
                itemsCount: number;
                amount: number;
                createdAt: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                rider: {
                    id: string;
                    name: string;
                    phone: string;
                    status: import("@prisma/client").$Enums.RiderStatus;
                } | null;
                deliveryStatus: import("@prisma/client").$Enums.DeliveryStatus | null;
                etaMinutes: number | null;
            }[];
            tabs: {
                [k: string]: number;
            };
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getInventory(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            summary: {
                totalProducts: number;
                activeProducts: number;
                outOfStock: number;
                lowStock: number;
                hiddenProducts: number;
                draftProducts: number;
            };
            lowStockProducts: {
                productId: string;
                productName: string;
                variantId: string;
                quantity: number;
                threshold: number;
            }[];
            topSelling: {
                productId: string;
                productName: string;
                unitsSold: number;
            }[];
        };
    }>;
    getRiders(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            assignedRiders: number;
            onlineRiders: number;
            currentDeliveries: number;
            riders: {
                riderId: string;
                name: string;
                phone: string;
                status: import("@prisma/client").$Enums.RiderStatus;
                currentOrder: {
                    id: string;
                    orderNumber: string;
                };
                deliveryStatus: import("@prisma/client").$Enums.DeliveryStatus;
                etaMinutes: number | null;
                lastLocation: {
                    lat: number;
                    lng: number;
                    recordedAt: string;
                } | null;
            }[];
        };
    }>;
    getAnalytics(user: RequestUser, query: MerchantDashboardAnalyticsQueryDto): Promise<{
        success: boolean;
        data: {
            period: "30d" | "7d";
            ordersToday: number;
            ordersThisWeek: number;
            ordersThisMonth: number;
            avgPrepTimeMins: number;
            cancellationRate: number;
            acceptanceRate: number;
            revenueSeries: {
                date: string;
                revenue: number;
                orders: number;
            }[];
            categorySales: {
                category: string;
                revenue: number;
                units: number;
            }[];
            hourlyDemand: {
                hour: number;
                orders: number;
            }[];
            bestSellers: {
                productId: string;
                productName: string;
                units: number;
                revenue: number;
            }[];
            worstSellers: {
                productId: string;
                productName: string;
                units: number;
                revenue: number;
            }[];
        };
    }>;
    getCustomers(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            recentReviews: {
                id: string;
                rating: number;
                comment: string | null;
                customerName: string;
                createdAt: string;
            }[];
            totalCustomers: number;
            returningCustomers: number;
            newCustomers: number;
            repeatPurchasePct: number;
            topCustomers: never[];
            recentComplaints: {
                id: string;
                message: string;
                createdAt: string;
            }[];
        } | {
            totalCustomers: number;
            returningCustomers: number;
            newCustomers: number;
            repeatPurchasePct: number;
            topCustomers: {
                id: string;
                name: string;
                phone: string | undefined;
                orderCount: number;
            }[];
            recentReviews: {
                id: string;
                rating: number;
                comment: string | null;
                customerName: string;
                createdAt: string;
            }[];
            recentComplaints: never[];
        };
    }>;
    getCompliance(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            stores: never[];
            categoryRequests: {
                approved: number;
                pending: number;
                rejected: number;
                documentsRequired: number;
            };
            alerts: never[];
        } | {
            stores: {
                id: string;
                name: string;
                approvalStatus: import("@prisma/client").$Enums.StoreStatus;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                gstProvided: boolean;
                fssaiProvided: boolean;
                documents: {
                    type: import("@prisma/client").$Enums.StoreDocumentType;
                    uploadedAt: string;
                }[];
                timeline: ({
                    event: string;
                    at: string;
                    note?: undefined;
                } | {
                    event: string;
                    at: string;
                    note: string | null;
                } | null)[];
            }[];
            categoryRequests: {
                approved: number;
                pending: number;
                underReview: number;
                rejected: number;
                documentsRequired: number;
            };
            alerts: {
                storeId: string;
                storeName: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                message: string;
            }[];
        };
    }>;
    getNotifications(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            recentOrders: {
                id: string;
                orderNumber: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                createdAt: string;
            }[];
            newReviews: {
                id: string;
                rating: number;
                createdAt: string;
            }[];
            inventoryAlerts: number;
            complianceAlerts: never[] | {
                storeId: string;
                storeName: string;
                status: import("@prisma/client").$Enums.StoreStatus;
                message: string;
            }[];
            categoryRequests: number;
        };
    }>;
}
