import { PrismaService } from '../../database/prisma.service';
import { WebPushService } from './web-push.service';
import { PushSubscribeDto, PushUnsubscribeDto } from './dto/push-subscribe.dto';
export declare class BuyerPushSubscriptionService {
    private readonly prisma;
    private readonly webPush;
    constructor(prisma: PrismaService, webPush: WebPushService);
    getStatus(userId: string): any;
    getPushStatus(userId: string): Promise<{
        configured: boolean;
        publicKey: string | null;
        subscribed: boolean;
        activeSubscriptions: any;
    }>;
    subscribe(userId: string, dto: PushSubscribeDto): Promise<any>;
    unsubscribe(userId: string, dto: PushUnsubscribeDto): Promise<{
        updated: any;
    }>;
}
