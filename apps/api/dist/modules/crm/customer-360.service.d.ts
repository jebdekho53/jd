import { PrismaService } from '../../database/prisma.service';
import { CustomerTimelineService } from '../support/customer-timeline.service';
export declare class Customer360Service {
    private readonly prisma;
    private readonly timeline;
    constructor(prisma: PrismaService, timeline: CustomerTimelineService);
    getProfile(userId: string): Promise<{
        user: {
            id: string;
            phone: string;
            email: string | null;
            name: string;
            createdAt: Date;
        };
        segments: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            code: string;
            kind: import("@prisma/client").$Enums.SegmentKind;
            isActive: boolean;
            rules: import("@prisma/client/runtime/library").JsonValue;
            isDynamic: boolean;
            memberCount: number;
            lastRefreshedAt: Date | null;
        }[];
        tags: {
            id: string;
            name: string;
            createdAt: Date;
            color: string | null;
        }[];
        preferences: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            pushEnabled: boolean;
            emailEnabled: boolean;
            smsEnabled: boolean;
            whatsappEnabled: boolean;
            marketingConsent: boolean;
            orderUpdates: boolean;
            walletAlerts: boolean;
            offerAlerts: boolean;
            referralAlerts: boolean;
            supportAlerts: boolean;
            complianceAlerts: boolean;
        } | null;
        wallet: {
            deviceFingerprint: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            buyerProfileId: string;
            referralCode: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            rewardPoints: number;
            lifetimePoints: number;
            tier: import("@prisma/client").$Enums.LoyaltyTier;
            referredById: string | null;
        } | null;
        orders: {
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            orderNumber: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
        carts: ({
            store: {
                name: string;
            };
            items: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                variantId: string;
                quantity: number;
                cartId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            buyerProfileId: string;
            appliedCouponId: string | null;
            appliedPromotionId: string | null;
            appliedOfferId: string | null;
        })[];
        timeline: ({
            type: "order";
            id: string;
            label: string;
            detail: import("@prisma/client").$Enums.OrderStatus;
            amount: number;
            at: Date;
        } | {
            type: "wallet";
            id: string;
            label: import("@prisma/client").$Enums.WalletTransactionType;
            detail: string;
            amount: number;
            at: Date;
        } | {
            type: "support";
            id: string;
            label: string;
            detail: string;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            at: Date;
        } | {
            type: "fraud";
            id: string;
            label: string;
            detail: string;
            status: import("@prisma/client").$Enums.FraudCaseStatus;
            at: Date;
        } | {
            type: "refund";
            id: string;
            label: string;
            detail: string;
            amount: number;
            at: Date;
        })[];
        searches: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            eventType: import("@prisma/client").$Enums.MarketingEventType;
            userId: string | null;
            storeId: string | null;
            productId: string | null;
            orderId: string | null;
            sessionId: string | null;
        }[];
        campaignEngagement: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            eventType: import("@prisma/client").$Enums.MarketingEventType;
            userId: string | null;
            storeId: string | null;
            productId: string | null;
            orderId: string | null;
            sessionId: string | null;
        }[];
        notificationHistory: {
            id: string;
            status: import("@prisma/client").$Enums.NotificationDeliveryStatus;
            errorMessage: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            templateId: string | null;
            deliveredAt: Date | null;
            subject: string | null;
            recipient: string;
            sentAt: Date | null;
            channel: import("@prisma/client").$Enums.NotificationChannel;
            body: string;
            notificationId: string | null;
            providerRef: string | null;
            queuedAt: Date | null;
            failedAt: Date | null;
        }[];
        metrics: {
            totalOrders: number;
            lifetimeValue: number;
        };
    }>;
}
