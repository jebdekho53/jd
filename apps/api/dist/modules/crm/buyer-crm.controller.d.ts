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
        data: any;
    }>;
    updatePreferences(user: RequestUser, dto: UpdatePreferencesDto): Promise<{
        success: boolean;
        data: any;
    }>;
    trackEvent(user: RequestUser, dto: TrackEventDto): Promise<{
        success: boolean;
        data: any;
    }>;
    recommendations(user: RequestUser, type?: 'product' | 'store' | 'offer' | 'category'): Promise<{
        success: boolean;
        data: any;
    }>;
    notificationHistory(user: RequestUser, page?: number): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    inbox(user: RequestUser, page?: number): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            unread: any;
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
