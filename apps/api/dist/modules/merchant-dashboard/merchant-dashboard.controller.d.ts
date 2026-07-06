import { RequestUser } from '../../common/types';
import { MerchantDashboardService } from './merchant-dashboard.service';
import { MerchantDashboardAnalyticsQueryDto, MerchantDashboardOrdersQueryDto, MerchantDashboardStoreQueryDto } from './dto/merchant-dashboard-query.dto';
export declare class MerchantDashboardController {
    private readonly dashboard;
    constructor(dashboard: MerchantDashboardService);
    getOverview(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            todayOrders: any;
            todayRevenue: number;
            pendingOrders: any;
            preparingOrders: any;
            packingOrders: any;
            readyForPickup: any;
            deliveredToday: any;
            cancelledOrders: any;
            avgOrderValue: number;
            customerRating: number;
            ratingCount: any;
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
            orders: any;
            tabs: {
                [k: string]: any;
            };
            meta: {
                page: number;
                limit: number;
                total: any;
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
                draftProducts: any;
            };
            lowStockProducts: any;
            topSelling: any;
        };
    }>;
    getRiders(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            assignedRiders: any;
            onlineRiders: any;
            currentDeliveries: any;
            riders: any;
        };
    }>;
    getAnalytics(user: RequestUser, query: MerchantDashboardAnalyticsQueryDto): Promise<{
        success: boolean;
        data: {
            period: "30d" | "7d";
            ordersToday: any;
            ordersThisWeek: any;
            ordersThisMonth: any;
            avgPrepTimeMins: number;
            cancellationRate: number;
            acceptanceRate: number;
            revenueSeries: any;
            categorySales: any;
            hourlyDemand: any;
            bestSellers: {
                productId: any;
                productName: any;
                units: any;
                revenue: number;
            }[];
            worstSellers: {
                productId: any;
                productName: any;
                units: any;
                revenue: number;
            }[];
        };
    }>;
    getCustomers(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            recentReviews: any;
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
                name: any;
                phone: any;
                orderCount: number;
            }[];
            recentReviews: any;
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
            stores: any;
            categoryRequests: {
                approved: any;
                pending: any;
                underReview: any;
                rejected: any;
                documentsRequired: any;
            };
            alerts: any;
        };
    }>;
    getNotifications(user: RequestUser, query: MerchantDashboardStoreQueryDto): Promise<{
        success: boolean;
        data: {
            recentOrders: any;
            newReviews: any;
            inventoryAlerts: any;
            complianceAlerts: any;
            categoryRequests: any;
        };
    }>;
}
