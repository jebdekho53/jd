import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportQueryDto, AnalyticsSalesQueryDto } from './dto/analytics-query.dto';
export declare class AdminAnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    getExecutive(): Promise<{
        success: boolean;
        data: {
            priorDay: import("./analytics-metrics.types").ExecutiveMetrics | null;
            gmv: number;
            orders: number;
            revenue: number;
            activeBuyers: number;
            activeMerchants: number;
            activeRiders: number;
            conversionRate: number;
            aov: number;
            refundRate: number;
            walletLiability: number;
            rewardLiability: number;
            growthPct: {
                gmv: number;
                orders: number;
                revenue: number;
            };
            asOf: string;
            source: string;
        };
    }>;
    getSales(query: AnalyticsSalesQueryDto): Promise<{
        success: boolean;
        data: {
            granularity: string;
            series: import("./analytics-metrics.types").SalesPoint[];
            comparisons: {
                current: {
                    orders: number;
                    gmv: number;
                };
                previous: {
                    orders: number;
                    gmv: number;
                };
                label: string;
            } | null;
            source: string;
        };
    }>;
    getOrders(): Promise<{
        success: boolean;
        data: {
            created: number;
            completed: number;
            cancelled: number;
            returned: number;
            codPct: number;
            walletPct: number;
            razorpayPct: number;
            avgDeliveryMins: number;
            avgPrepMins: number;
            source: string;
        };
    }>;
    getCustomers(): Promise<{
        success: boolean;
        data: {
            newCustomers: number;
            returningCustomers: number;
            retentionPct: number;
            repeatPurchasePct: number;
            topCustomers: {
                name: string;
                orders: number;
                spend: number;
            }[];
            walletUsers: number;
            tierDistribution: {
                tier: string;
                count: number;
            }[];
            referralPerformance: {
                completed: number;
                pending: number;
            };
            source: string;
        };
    }>;
    getMerchants(): Promise<{
        success: boolean;
        data: {
            source: string;
            topStores: {
                storeId: string | null;
                date: Date;
                metrics: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
    }>;
    getRiders(): Promise<{
        success: boolean;
        data: {
            deliveriesCompleted: number;
            avgDeliveryMins: number;
            acceptanceRate: number;
            rejectionRate: number;
            activeHours: number;
            distanceCoveredKm: number;
            revenueGenerated: number;
            topRiders: {
                riderId: string;
                name: string;
                deliveries: number;
            }[];
            lowPerformingRiders: {
                riderId: string;
                name: string;
                deliveries: number;
                lateRate: number;
            }[];
            source: string;
        };
    }>;
    getGeo(): Promise<{
        success: boolean;
        data: {
            topCities: {
                name: string;
                count: number;
                revenue: number;
            }[];
            topAreas: {
                name: string;
                count: number;
                revenue: number;
            }[];
            topLocalities: {
                name: string;
                count: number;
                revenue: number;
            }[];
            highDemandZones: {
                key: string;
                count: number;
            }[];
            lowCoverageZones: {
                key: string;
                storeCount: number;
                orderCount: number;
            }[];
            deliveryHeatmap: {
                lat: number;
                lng: number;
                weight: number;
            }[];
            storeDensity: number;
            riderDensity: number;
            source: string;
        };
    }>;
    getInventory(): Promise<{
        success: boolean;
        data: {
            fastMoving: {
                name: string;
                soldQty: number;
            }[];
            slowMoving: {
                name: string;
                availableQty: number;
            }[];
            lowStockRisk: number;
            deadInventory: number;
            inventoryTurnover: number;
            lostSalesOos: number;
            source: string;
        };
    }>;
    getWalletRewards(): Promise<{
        success: boolean;
        data: {
            walletCredits: number;
            walletDebits: number;
            outstandingLiability: number;
            rewardIssued: number;
            rewardRedeemed: number;
            rewardExpired: number;
            referralPerformance: {
                completed: number;
                pending: number;
            };
            tierUpgrades: number;
            source: string;
        };
    }>;
    getFunnel(): Promise<{
        success: boolean;
        data: {
            visitors: number;
            searches: number;
            storeViews: number;
            productViews: number;
            addToCart: number;
            checkoutStarted: number;
            orderCreated: number;
            orderCompleted: number;
            dropOffPct: Record<string, number>;
            source: string;
        };
    }>;
    getAlerts(): Promise<{
        success: boolean;
        data: {
            source: string;
            alerts: {
                message: string;
                id: string;
                status: import("@prisma/client").$Enums.AnalyticsAlertStatus;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                severity: import("@prisma/client").$Enums.AnalyticsAlertSeverity;
                title: string;
                resolvedAt: Date | null;
                alertType: string;
            }[];
        };
    }>;
    acknowledge(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
            id: string;
            status: import("@prisma/client").$Enums.AnalyticsAlertStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            severity: import("@prisma/client").$Enums.AnalyticsAlertSeverity;
            title: string;
            resolvedAt: Date | null;
            alertType: string;
        };
    }>;
    export(query: AnalyticsExportQueryDto, res: Response): Promise<void>;
    getControlRoom(): Promise<{
        success: boolean;
        data: {
            orders: {
                active: number;
                today: number;
                unassigned: number;
            };
            riders: {
                online: number;
                busy: number;
                offline: number;
            };
            deliveries: {
                inProgress: number;
                completedToday: number;
            };
            revenue: {
                today: number;
                lastHour: number;
            };
            storeActivity: {
                activeStores: number;
                preparingOrders: number;
            };
            fraudAlerts: number;
            systemHealth: {
                api: string;
                db: string;
            };
            alerts: {
                id: string;
                title: string;
                severity: string;
            }[];
            updatedAt: string;
        };
    }>;
}
