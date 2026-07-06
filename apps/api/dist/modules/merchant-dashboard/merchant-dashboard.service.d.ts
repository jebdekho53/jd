import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardAnalyticsQueryDto, MerchantDashboardOrdersQueryDto, MerchantDashboardStoreQueryDto } from './dto/merchant-dashboard-query.dto';
type SparkPoint = {
    date: string;
    value: number;
};
interface StoreContext {
    storeIds: string[];
    merchantProfileId: string | null;
}
export declare class MerchantDashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    resolveStoreContext(userId: string, storeId?: string): Promise<StoreContext>;
    getOverview(userId: string, query: MerchantDashboardStoreQueryDto): Promise<{
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
        sparkline: SparkPoint[];
    }>;
    getOrders(userId: string, query: MerchantDashboardOrdersQueryDto): Promise<{
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
    }>;
    getInventory(userId: string, query: MerchantDashboardStoreQueryDto): Promise<{
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
    }>;
    getRiders(userId: string, query: MerchantDashboardStoreQueryDto): Promise<{
        assignedRiders: any;
        onlineRiders: any;
        currentDeliveries: any;
        riders: any;
    }>;
    getAnalytics(userId: string, query: MerchantDashboardAnalyticsQueryDto): Promise<{
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
    }>;
    getCustomers(userId: string, query: MerchantDashboardStoreQueryDto): Promise<{
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
    }>;
    getCompliance(userId: string, query: MerchantDashboardStoreQueryDto): Promise<{
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
    }>;
    getNotifications(userId: string, query: MerchantDashboardStoreQueryDto): Promise<{
        recentOrders: any;
        newReviews: any;
        inventoryAlerts: any;
        complianceAlerts: any;
        categoryRequests: any;
    }>;
}
export {};
