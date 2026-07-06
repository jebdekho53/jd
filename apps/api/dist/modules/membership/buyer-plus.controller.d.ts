import { RequestUser } from '../../common/types';
import { MembershipService } from './membership.service';
import { MembershipAnalyticsService } from './membership-analytics.service';
export declare class BuyerPlusController {
    private readonly membership;
    private readonly analytics;
    constructor(membership: MembershipService, analytics: MembershipAnalyticsService);
    plans(): Promise<{
        success: boolean;
        data: any;
    }>;
    subscribe(user: RequestUser, body: {
        planId: string;
        yearly?: boolean;
    }): Promise<{
        success: boolean;
        data: any;
    }>;
    me(user: RequestUser): Promise<{
        success: boolean;
        data: {
            subscription: any;
            savings: any;
        };
    }>;
}
