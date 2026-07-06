import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AdminDashboardOrdersQueryDto, AdminDashboardStoresQueryDto } from './dto/admin-dashboard-query.dto';
export declare class AdminDashboardService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    private countUsersWithRole;
    private countPlatformUsers;
    getOverview(): Promise<{
        totalOrders: any;
        ordersToday: any;
        gmvToday: number;
        gmvThisMonth: number;
        totalUsers: any;
        totalBuyers: any;
        totalMerchants: any;
        totalRiders: any;
        totalStores: any;
        activeStores: any;
        approvedStores: any;
        pendingStores: any;
        rejectedStores: any;
        activeRiders: any;
        onlineRiders: any;
        newUsersToday: any;
        cancelledOrdersToday: any;
        failedPayments: any;
        platformRevenue: number;
        storeStatusBreakdown: {
            [k: string]: any;
        };
    }>;
    getOrders(query: AdminDashboardOrdersQueryDto): Promise<{
        orders: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getStores(query: AdminDashboardStoresQueryDto): Promise<{
        summary: {
            [k: string]: any;
        };
        stores: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    private computeStoreRiskScore;
    getRiders(): Promise<{
        online: any;
        offline: any;
        busy: any;
        available: any;
        pendingKyc: any;
        rejectedKyc: any;
        riders: any;
    }>;
    getUnassignedOrders(): Promise<{
        count: any;
        availableRiders: any;
        orders: any;
    }>;
    getPayments(): Promise<{
        codOrdersToday: any;
        paidOrdersToday: any;
        failedPayments: any;
        refunds: any;
        revenueTrend: any;
    }>;
    getCustomers(): Promise<{
        usersToday: any;
        activeUsers: any;
        repeatBuyers: number;
        suspiciousUsers: any;
        refundRequests: any;
    }>;
    getCategories(): Promise<{
        totalCategories: any;
        totalSubcategories: any;
        categoryRequests: {
            [k: string]: any;
        };
        pendingRequests: any;
        approvedRequests: any;
        topCategories: any;
        storesPerCategory: any;
    }>;
    getFraudRisk(): Promise<{
        rejectedMerchants: any;
        blockedUsers: any;
        failedVerifications: any;
        duplicateAccounts: any;
        riskEvents: any;
    }>;
    getSystemHealth(): Promise<{
        api: string;
        database: "up" | "down";
        redis: "up" | "down";
        queueHealth: string;
        pendingCheckouts: any;
        websocket: string;
        backgroundJobs: string;
        cronStatus: string;
        sms: string;
        whatsapp: string;
        email: string;
        googleMaps: string;
        shadowfax: string;
        pushNotifications: string;
    }>;
}
