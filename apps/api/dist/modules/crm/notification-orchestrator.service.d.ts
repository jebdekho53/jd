import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { Msg91Service } from '../auth/msg91.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
export interface SendNotificationInput {
    userId: string;
    channel: NotificationChannel;
    templateCode: string;
    type?: NotificationType;
    title?: string;
    variables?: Record<string, string>;
}
export declare class NotificationOrchestratorService {
    private readonly prisma;
    private readonly email;
    private readonly sms;
    private readonly buyerPush;
    private readonly logger;
    private readonly cfg;
    constructor(prisma: PrismaService, email: EmailService, sms: Msg91Service, buyerPush: BuyerPushNotificationService, configService: ConfigService);
    listTemplates(category?: string): Promise<any>;
    getPreferences(userId: string): Promise<any>;
    updatePreferences(userId: string, data: Record<string, boolean>): Promise<any>;
    canSend(userId: string, channel: NotificationChannel, category: string): Promise<boolean>;
    send(input: SendNotificationInput): Promise<{
        skipped: boolean;
        reason: string;
        delivery?: undefined;
        notification?: undefined;
        failed?: undefined;
        error?: undefined;
    } | {
        delivery: any;
        notification: any;
        skipped?: undefined;
        reason?: undefined;
        failed?: undefined;
        error?: undefined;
    } | {
        delivery: any;
        notification: any;
        failed: boolean;
        error: string;
        skipped?: undefined;
        reason?: undefined;
    }>;
    listInApp(userId: string, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        unread: any;
        page: number;
        limit: number;
    }>;
    markInAppRead(userId: string, notificationId: string): Promise<any>;
    markAllInAppRead(userId: string): Promise<any>;
    listDeliveries(userId: string, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    private templateCategoryToPushKind;
}
