import { Prisma } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { MarketingEventService } from './marketing-event.service';
import { RecommendationService } from './recommendation.service';
import { TrackEventDto, UpdatePreferencesDto } from './dto/crm.dto';
export declare class BuyerCrmController {
    private readonly notifications;
    private readonly events;
    private readonly recommendationService;
    constructor(notifications: NotificationOrchestratorService, events: MarketingEventService, recommendationService: RecommendationService);
    getPreferences(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updatePreferences(user: RequestUser, dto: UpdatePreferencesDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    trackEvent(user: RequestUser, dto: TrackEventDto): Promise<{
        success: boolean;
        data: {
            id: string;
            metadata: Prisma.JsonValue | null;
            createdAt: Date;
            eventType: import("@prisma/client").$Enums.MarketingEventType;
            userId: string | null;
            storeId: string | null;
            productId: string | null;
            orderId: string | null;
            sessionId: string | null;
        };
    }>;
    recommendations(user: RequestUser, type?: 'product' | 'store' | 'offer' | 'category'): Promise<{
        success: boolean;
        data: {
            id: string;
            userId: string;
            updatedAt: Date;
            reason: string | null;
            entityType: string;
            entityId: string;
            score: number;
        }[] | {
            entityType: string;
            entityId: string;
            score: number;
            reason: string;
        }[];
    }>;
    notificationHistory(user: RequestUser, page?: number): Promise<{
        success: boolean;
        data: {
            items: {
                id: string;
                status: import("@prisma/client").$Enums.NotificationDeliveryStatus;
                errorMessage: string | null;
                metadata: Prisma.JsonValue | null;
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
            total: number;
            page: number;
            limit: number;
        };
    }>;
    inbox(user: RequestUser, page?: number): Promise<{
        success: boolean;
        data: {
            items: {
                type: import("@prisma/client").$Enums.NotificationType;
                data: Prisma.JsonValue | null;
                id: string;
                createdAt: Date;
                userId: string;
                body: string;
                title: string;
                isRead: boolean;
                readAt: Date | null;
            }[];
            total: number;
            unread: number;
            page: number;
            limit: number;
        };
    }>;
    markRead(user: RequestUser, id: string): Promise<{
        success: boolean;
    }>;
    markAllRead(user: RequestUser): Promise<{
        success: boolean;
    }>;
}
