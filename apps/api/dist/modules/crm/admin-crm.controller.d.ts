import { SegmentService } from './segment.service';
import { JourneyEngineService } from './journey-engine.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { CrmAnalyticsService } from './crm-analytics.service';
import { Customer360Service } from './customer-360.service';
import { CreatePushCampaignDto, ListQueryDto } from './dto/crm.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminCrmController {
    private readonly segments;
    private readonly journeys;
    private readonly notifications;
    private readonly analytics;
    private readonly customer360;
    private readonly prisma;
    constructor(segments: SegmentService, journeys: JourneyEngineService, notifications: NotificationOrchestratorService, analytics: CrmAnalyticsService, customer360: Customer360Service, prisma: PrismaService);
    overview(): Promise<{
        success: boolean;
        data: {
            segments: {
                count: number;
                totalMembers: number;
            };
            journeys: Record<string, number>;
            eventsCaptured: number;
            openRate: number;
            ctr: number;
            conversionRate: number;
            revenue: number;
            retentionPct: number;
            repeatPurchaseRate: number;
            campaignRoi: number;
            deliveriesByChannel: Record<string, number>;
            csat: number | null;
            ltvEstimate: number;
        };
    }>;
    listSegments(): Promise<{
        success: boolean;
        data: {
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
    }>;
    refreshSegment(id: string): Promise<{
        success: boolean;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            memberCount: number;
        };
    }>;
    segmentMembers(id: string, query: ListQueryDto): Promise<{
        success: boolean;
        data: {
            items: ({
                user: {
                    phone: string;
                    email: string | null;
                    id: string;
                };
            } & {
                userId: string;
                segmentId: string;
                addedAt: Date;
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    listJourneys(): Promise<{
        success: boolean;
        data: ({
            steps: {
                id: string;
                name: string;
                createdAt: Date;
                templateCode: string | null;
                channel: import("@prisma/client").$Enums.NotificationChannel;
                journeyId: string;
                stepOrder: number;
                delayMinutes: number;
                actionConfig: import("@prisma/client/runtime/library").JsonValue;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.JourneyStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            code: string;
            isActive: boolean;
            trigger: import("@prisma/client").$Enums.AutomationTrigger;
        })[];
    }>;
    listCampaigns(): Promise<{
        success: boolean;
        data: {
            push: {
                id: string;
                status: import("@prisma/client").$Enums.MarketingCampaignStatus;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                templateCode: string;
                segmentId: string | null;
                scheduledAt: Date | null;
                revenue: import("@prisma/client/runtime/library").Decimal;
                clickCount: number;
                variantA: import("@prisma/client/runtime/library").JsonValue;
                variantB: import("@prisma/client/runtime/library").JsonValue | null;
                winnerVariant: import("@prisma/client").$Enums.AbVariantKey | null;
                sentCount: number;
                openCount: number;
                conversionCount: number;
            }[];
            email: {
                id: string;
                status: import("@prisma/client").$Enums.MarketingCampaignStatus;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                subject: string;
                templateCode: string;
                segmentId: string | null;
                scheduledAt: Date | null;
                revenue: import("@prisma/client/runtime/library").Decimal;
                clickCount: number;
                variantA: import("@prisma/client/runtime/library").JsonValue;
                variantB: import("@prisma/client/runtime/library").JsonValue | null;
                winnerVariant: import("@prisma/client").$Enums.AbVariantKey | null;
                sentCount: number;
                openCount: number;
                conversionCount: number;
            }[];
            sms: {
                id: string;
                status: import("@prisma/client").$Enums.MarketingCampaignStatus;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                templateCode: string;
                segmentId: string | null;
                scheduledAt: Date | null;
                revenue: import("@prisma/client/runtime/library").Decimal;
                clickCount: number;
                variantA: import("@prisma/client/runtime/library").JsonValue;
                variantB: import("@prisma/client/runtime/library").JsonValue | null;
                winnerVariant: import("@prisma/client").$Enums.AbVariantKey | null;
                sentCount: number;
                openCount: number;
                conversionCount: number;
            }[];
            whatsapp: {
                id: string;
                status: import("@prisma/client").$Enums.MarketingCampaignStatus;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                templateCode: string;
                segmentId: string | null;
                scheduledAt: Date | null;
                revenue: import("@prisma/client/runtime/library").Decimal;
                clickCount: number;
                variantA: import("@prisma/client/runtime/library").JsonValue;
                variantB: import("@prisma/client/runtime/library").JsonValue | null;
                winnerVariant: import("@prisma/client").$Enums.AbVariantKey | null;
                sentCount: number;
                openCount: number;
                conversionCount: number;
            }[];
        };
    }>;
    createPushCampaign(dto: CreatePushCampaignDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.MarketingCampaignStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            templateCode: string;
            segmentId: string | null;
            scheduledAt: Date | null;
            revenue: import("@prisma/client/runtime/library").Decimal;
            clickCount: number;
            variantA: import("@prisma/client/runtime/library").JsonValue;
            variantB: import("@prisma/client/runtime/library").JsonValue | null;
            winnerVariant: import("@prisma/client").$Enums.AbVariantKey | null;
            sentCount: number;
            openCount: number;
            conversionCount: number;
        };
    }>;
    templates(category?: string): Promise<{
        success: boolean;
        data: {
            category: string;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            body: string;
            code: string;
            isActive: boolean;
            subject: string | null;
            channel: import("@prisma/client").$Enums.NotificationChannel;
        }[];
    }>;
    deliveries(query: ListQueryDto): Promise<{
        success: boolean;
        data: {
            items: {
                id: string;
                status: import("@prisma/client").$Enums.NotificationDeliveryStatus;
                errorMessage: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                userId: string;
                templateId: string | null;
                body: string;
                deliveredAt: Date | null;
                subject: string | null;
                recipient: string;
                sentAt: Date | null;
                channel: import("@prisma/client").$Enums.NotificationChannel;
                notificationId: string | null;
                providerRef: string | null;
                queuedAt: Date | null;
                failedAt: Date | null;
            }[];
        };
    }>;
    customerProfile(userId: string): Promise<{
        success: boolean;
        data: {
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
                body: string;
                deliveredAt: Date | null;
                subject: string | null;
                recipient: string;
                sentAt: Date | null;
                channel: import("@prisma/client").$Enums.NotificationChannel;
                notificationId: string | null;
                providerRef: string | null;
                queuedAt: Date | null;
                failedAt: Date | null;
            }[];
            metrics: {
                totalOrders: number;
                lifetimeValue: number;
            };
        };
    }>;
    selectWinner(type: 'push' | 'email', id: string): Promise<{
        success: boolean;
        data: {
            winner: import("@prisma/client").$Enums.AbVariantKey;
        };
    }>;
}
