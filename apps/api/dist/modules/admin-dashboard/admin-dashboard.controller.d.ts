import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardOrdersQueryDto, AdminDashboardStoresQueryDto } from './dto/admin-dashboard-query.dto';
export declare class AdminDashboardController {
    private readonly dashboard;
    constructor(dashboard: AdminDashboardService);
    getOverview(): Promise<{
        success: boolean;
        data: {
            totalOrders: number;
            ordersToday: number;
            gmvToday: number;
            gmvThisMonth: number;
            totalUsers: number;
            totalBuyers: number;
            totalMerchants: number;
            totalRiders: number;
            totalStores: number;
            activeStores: number;
            approvedStores: number;
            pendingStores: number;
            rejectedStores: number;
            activeRiders: number;
            onlineRiders: number;
            newUsersToday: number;
            cancelledOrdersToday: number;
            failedPayments: number;
            platformRevenue: number;
            storeStatusBreakdown: {
                [k: string]: number;
            };
        };
    }>;
    getOrders(query: AdminDashboardOrdersQueryDto): Promise<{
        success: boolean;
        data: {
            orders: {
                id: string;
                orderNumber: string;
                buyer: string;
                store: string;
                storeId: string;
                merchant: string;
                city: string;
                rider: string | null;
                riderId: string | null;
                amount: number;
                status: import("@prisma/client").$Enums.OrderStatus;
                createdAt: string;
                deliveryEta: number | null;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getStores(query: AdminDashboardStoresQueryDto): Promise<{
        success: boolean;
        data: {
            summary: {
                [k: string]: number;
            };
            stores: {
                id: string;
                name: string;
                merchant: string;
                gst: string | null;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                status: import("@prisma/client").$Enums.StoreStatus;
                appliedAt: string | null;
                documentCount: number;
                riskScore: number;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getRiders(): Promise<{
        success: boolean;
        data: {
            online: number;
            offline: number;
            busy: number;
            available: number;
            pendingKyc: number;
            rejectedKyc: number;
            riders: {
                id: string;
                name: string;
                phone: string;
                status: import("@prisma/client").$Enums.RiderStatus;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                currentOrder: string;
            }[];
        };
    }>;
    getUnassigned(): Promise<{
        success: boolean;
        data: {
            count: number;
            availableRiders: number;
            orders: {
                id: string;
                orderNumber: string;
                store: string;
                zone: string;
                amount: number;
                waitingSince: string;
            }[];
        };
    }>;
    getPayments(): Promise<{
        success: boolean;
        data: {
            codOrdersToday: number;
            paidOrdersToday: number;
            failedPayments: number;
            refunds: number;
            revenueTrend: {
                date: string;
                revenue: number;
            }[];
        };
    }>;
    getCustomers(): Promise<{
        success: boolean;
        data: {
            usersToday: number;
            activeUsers: number;
            repeatBuyers: number;
            suspiciousUsers: number;
            refundRequests: number;
        };
    }>;
    getCategories(): Promise<{
        success: boolean;
        data: {
            totalCategories: number;
            totalSubcategories: number;
            categoryRequests: {
                [k: string]: number;
            };
            pendingRequests: number;
            approvedRequests: number;
            topCategories: {
                categoryId: string | null;
                name: string;
                productCount: number;
            }[];
            storesPerCategory: {
                categoryId: string;
                name: string;
                storeCount: number;
            }[];
        };
    }>;
    getFraudRisk(): Promise<{
        success: boolean;
        data: {
            rejectedMerchants: number;
            blockedUsers: number;
            failedVerifications: number;
            duplicateAccounts: number;
            riskEvents: {
                id: string;
                type: string;
                resource: string;
                at: string;
            }[];
        };
    }>;
    getSystemHealth(): Promise<{
        success: boolean;
        data: {
            api: string;
            database: "up" | "down";
            redis: "up" | "down";
            queueHealth: string;
            pendingCheckouts: number;
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
