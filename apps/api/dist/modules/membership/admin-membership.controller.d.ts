import { MembershipAnalyticsService } from './membership-analytics.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminMembershipController {
    private readonly analytics;
    private readonly prisma;
    constructor(analytics: MembershipAnalyticsService, prisma: PrismaService);
    overview(): Promise<{
        success: boolean;
        data: {
            metrics: {
                mrr: number;
                activeSubscribers: number;
                churnRate: number;
                retention: number;
                freeDeliverySavings: number;
            };
            subscribers: ({
                user: {
                    phone: string;
                };
                plan: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    active: boolean;
                    monthlyPrice: import("@prisma/client/runtime/library").Decimal;
                    yearlyPrice: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.MembershipSubscriptionStatus;
                createdAt: Date;
                expiresAt: Date;
                userId: string;
                updatedAt: Date;
                buyerProfileId: string | null;
                planId: string;
                startedAt: Date;
            })[];
        };
    }>;
}
export declare class AdminMembershipAnalyticsController {
    private readonly analytics;
    constructor(analytics: MembershipAnalyticsService);
    membership(): Promise<{
        success: boolean;
        data: {
            mrr: number;
            activeSubscribers: number;
            churnRate: number;
            retention: number;
            freeDeliverySavings: number;
        };
    }>;
}
