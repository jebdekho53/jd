import { MarketingEventType } from '@prisma/client';
export declare class ListQueryDto {
    page?: number;
    limit?: number;
}
export declare class TrackEventDto {
    eventType: MarketingEventType;
    sessionId?: string;
    storeId?: string;
    productId?: string;
    orderId?: string;
    metadata?: Record<string, unknown>;
}
export declare class UpdatePreferencesDto {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    whatsappEnabled?: boolean;
    marketingConsent?: boolean;
    orderUpdates?: boolean;
    walletAlerts?: boolean;
    offerAlerts?: boolean;
    referralAlerts?: boolean;
    supportAlerts?: boolean;
    complianceAlerts?: boolean;
}
export declare class CreatePushCampaignDto {
    name: string;
    segmentId?: string;
    templateCode: string;
}
