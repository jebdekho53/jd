import { PrismaService } from '../../database/prisma.service';
export declare class MembershipService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPlans(): Promise<({
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
    })[]>;
    getActiveSubscription(userId: string): Promise<({
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
    }) | null>;
    subscribe(userId: string, planId: string, yearly?: boolean): Promise<{
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
    }>;
    cancel(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.MembershipSubscriptionStatus;
        createdAt: Date;
        expiresAt: Date;
        userId: string;
        updatedAt: Date;
        buyerProfileId: string | null;
        planId: string;
        startedAt: Date;
    }>;
    renewExpiring(): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.MembershipSubscriptionStatus;
        createdAt: Date;
        expiresAt: Date;
        userId: string;
        updatedAt: Date;
        buyerProfileId: string | null;
        planId: string;
        startedAt: Date;
    }[]>;
}
