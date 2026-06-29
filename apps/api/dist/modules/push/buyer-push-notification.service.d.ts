import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { NotificationOrchestratorService } from '../crm/notification-orchestrator.service';
import type { BuyerPushKind } from './buyer-push.events';
import { type BuyerPushNotificationPayload } from './push-payload.builder';
import { WebPushService } from './web-push.service';
export declare class BuyerPushNotificationService {
    private readonly prisma;
    private readonly webPush;
    private readonly notifications;
    private readonly logger;
    private readonly buyerSiteUrl;
    constructor(prisma: PrismaService, webPush: WebPushService, notifications: NotificationOrchestratorService, configService: ConfigService);
    sendToUser(userId: string, kind: BuyerPushKind, payload: BuyerPushNotificationPayload): Promise<void>;
    private isAllowed;
    notifyOrderPlaced(orderId: string): Promise<void>;
    notifyOrderAccepted(orderId: string): Promise<void>;
    notifyReadyForPickup(orderId: string): Promise<void>;
    notifyRiderAssigned(orderId: string): Promise<void>;
    notifyOutForDelivery(orderId: string): Promise<void>;
    notifyDelivered(orderId: string): Promise<void>;
    notifyWalletCredited(userId: string, amount: number): Promise<void>;
    notifySupportReply(userId: string, ticketId: string, ticketNumber: string): Promise<void>;
    notifyOfferAvailable(userId: string, offerName: string, offerId?: string): Promise<void>;
    sendGeneric(userId: string, kind: BuyerPushKind, title: string, body: string): Promise<void>;
    private loadOrder;
}
