import { PrismaService } from '../../database/prisma.service';
import { BuyerPushNotificationService } from './buyer-push-notification.service';
import { type BuyerPushSupportReplyEvent } from './buyer-push.events';
export declare class BuyerPushListener {
    private readonly push;
    private readonly prisma;
    constructor(push: BuyerPushNotificationService, prisma: PrismaService);
    onWalletCredited(payload: {
        buyerProfileId: string;
        amount: number;
    }): Promise<void>;
    onSupportReply(payload: BuyerPushSupportReplyEvent): Promise<void>;
}
