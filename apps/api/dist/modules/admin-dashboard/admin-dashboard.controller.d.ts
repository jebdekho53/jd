import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardOrdersQueryDto, AdminDashboardStoresQueryDto } from './dto/admin-dashboard-query.dto';
export declare class AdminDashboardController {
    private readonly dashboard;
    constructor(dashboard: AdminDashboardService);
    getOverview(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getOrders(query: AdminDashboardOrdersQueryDto): Promise<{
        success: boolean;
        data: {
            orders: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    getStores(query: AdminDashboardStoresQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getRiders(): Promise<{
        success: boolean;
        data: {
            online: any;
            offline: any;
            busy: any;
            available: any;
            pendingKyc: any;
            rejectedKyc: any;
            riders: any;
        };
    }>;
    getUnassigned(): Promise<{
        success: boolean;
        data: {
            count: any;
            availableRiders: any;
            orders: any;
        };
    }>;
    getPayments(): Promise<{
        success: boolean;
        data: {
            codOrdersToday: any;
            paidOrdersToday: any;
            failedPayments: any;
            refunds: any;
            revenueTrend: any;
        };
    }>;
    getCustomers(): Promise<{
        success: boolean;
        data: {
            usersToday: any;
            activeUsers: any;
            repeatBuyers: number;
            suspiciousUsers: any;
            refundRequests: any;
        };
    }>;
    getCategories(): Promise<{
        success: boolean;
        data: {
            totalCategories: any;
            totalSubcategories: any;
            categoryRequests: {
                [k: string]: any;
            };
            pendingRequests: any;
            approvedRequests: any;
            topCategories: any;
            storesPerCategory: any;
        };
    }>;
    getFraudRisk(): Promise<{
        success: boolean;
        data: {
            rejectedMerchants: any;
            blockedUsers: any;
            failedVerifications: any;
            duplicateAccounts: any;
            riskEvents: any;
        };
    }>;
    getSystemHealth(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
