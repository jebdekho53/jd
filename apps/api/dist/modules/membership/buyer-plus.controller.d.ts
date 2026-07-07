import { RequestUser } from '../../common/types';
import { MembershipService } from './membership.service';
import { MembershipAnalyticsService } from './membership-analytics.service';
export declare class BuyerPlusController {
    private readonly membership;
    private readonly analytics;
    constructor(membership: MembershipService, analytics: MembershipAnalyticsService);
    plans(): Promise<{
        success: boolean;
        data: ({
            benefits: {
                type: import("@prisma/client").$Enums.MembershipBenefitType;
                id: string;
                planId: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            active: boolean;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            yearlyPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    }>;
    subscribe(user: RequestUser, body: {
        planId: string;
        yearly?: boolean;
    }): Promise<{
        success: boolean;
        data: {
            plan: {
                benefits: {
                    type: import("@prisma/client").$Enums.MembershipBenefitType;
                    id: string;
                    planId: string;
                }[];
            } & {
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
        };
    }>;
    me(user: RequestUser): Promise<{
        success: boolean;
        data: {
            subscription: ({
                plan: {
                    benefits: {
                        type: import("@prisma/client").$Enums.MembershipBenefitType;
                        id: string;
                        planId: string;
                    }[];
                } & {
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
            }) | null;
            savings: {
                savings: number;
                usages: number;
                plan?: undefined;
            } | {
                savings: number;
                usages: number;
                plan: string;
            };
        };
    }>;
}
