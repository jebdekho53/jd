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
                count: any;
                totalMembers: any;
            };
            journeys: any;
            eventsCaptured: any;
            openRate: number;
            ctr: number;
            conversionRate: number;
            revenue: any;
            retentionPct: number;
            repeatPurchaseRate: number;
            campaignRoi: number;
            deliveriesByChannel: any;
            csat: number | null;
            ltvEstimate: number;
        };
    }>;
    listSegments(): Promise<{
        success: boolean;
        data: any;
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
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    listJourneys(): Promise<{
        success: boolean;
        data: any;
    }>;
    listCampaigns(): Promise<{
        success: boolean;
        data: {
            push: any;
            email: any;
            sms: any;
            whatsapp: any;
        };
    }>;
    createPushCampaign(dto: CreatePushCampaignDto): Promise<{
        success: boolean;
        data: any;
    }>;
    templates(category?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    deliveries(query: ListQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
        };
    }>;
    customerProfile(userId: string): Promise<{
        success: boolean;
        data: {
            user: {
                id: any;
                phone: any;
                email: any;
                name: any;
                createdAt: any;
            };
            segments: any;
            tags: any;
            preferences: any;
            wallet: any;
            orders: any;
            carts: any;
            timeline: any;
            searches: any;
            campaignEngagement: any;
            notificationHistory: any;
            metrics: {
                totalOrders: any;
                lifetimeValue: number;
            };
        };
    }>;
    selectWinner(type: 'push' | 'email', id: string): Promise<{
        success: boolean;
        data: {
            winner: AbVariantKey;
        };
    }>;
}
