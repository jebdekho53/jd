import { RequestUser } from '../../common/types';
import { BuyerPushSubscriptionService } from './buyer-push-subscription.service';
import { PushSubscribeDto, PushUnsubscribeDto } from './dto/push-subscribe.dto';
export declare class BuyerPushController {
    private readonly subscriptions;
    constructor(subscriptions: BuyerPushSubscriptionService);
    status(user: RequestUser): Promise<{
        success: boolean;
        data: {
            configured: boolean;
            publicKey: string | null;
            subscribed: boolean;
            activeSubscriptions: number;
        };
    }>;
    subscribe(user: RequestUser, dto: PushSubscribeDto): Promise<{
        success: boolean;
        data: {
            id: string;
            endpoint: string;
            isActive: boolean;
        };
    }>;
    unsubscribe(user: RequestUser, dto: PushUnsubscribeDto): Promise<{
        success: boolean;
        data: {
            updated: number;
        };
    }>;
}
