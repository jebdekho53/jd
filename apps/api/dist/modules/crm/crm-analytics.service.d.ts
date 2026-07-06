import { AbVariantKey } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class CrmAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
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
    }>;
    listCampaigns(): Promise<{
        push: any;
        email: any;
        sms: any;
        whatsapp: any;
    }>;
    selectAbWinner(campaignType: 'push' | 'email', campaignId: string): Promise<AbVariantKey>;
}
