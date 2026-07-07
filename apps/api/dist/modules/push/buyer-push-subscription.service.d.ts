import { PrismaService } from '../../database/prisma.service';
import { WebPushService } from './web-push.service';
import { PushSubscribeDto, PushUnsubscribeDto } from './dto/push-subscribe.dto';
export declare class BuyerPushSubscriptionService {
    private readonly prisma;
    private readonly webPush;
    constructor(prisma: PrismaService, webPush: WebPushService);
    getStatus(userId: string): import("@prisma/client").Prisma.PrismaPromise<number>;
    getPushStatus(userId: string): Promise<{
        configured: boolean;
        publicKey: string | null;
        subscribed: boolean;
        activeSubscriptions: number;
    }>;
    subscribe(userId: string, dto: PushSubscribeDto): Promise<{
        id: string;
        userAgent: string | null;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        lastSeenAt: Date;
        isActive: boolean;
        auth: string;
        endpoint: string;
        p256dh: string;
        deviceType: import("@prisma/client").$Enums.PushDeviceType;
    }>;
    unsubscribe(userId: string, dto: PushUnsubscribeDto): Promise<{
        updated: number;
    }>;
}
