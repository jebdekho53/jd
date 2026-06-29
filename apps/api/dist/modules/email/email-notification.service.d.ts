import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
export declare class EmailNotificationService {
    private readonly email;
    private readonly templates;
    private readonly prisma;
    private readonly logger;
    private readonly buyerSiteUrl;
    private readonly adminSiteUrl;
    private readonly merchantSiteUrl;
    constructor(email: EmailService, templates: EmailTemplateService, prisma: PrismaService, configService: ConfigService);
    sendOtpEmail(to: string, code: string, expiresInSeconds: number): Promise<void>;
    sendWelcomeEmail(to: string, name: string): Promise<void>;
    sendPasswordResetEmail(to: string, token: string, expiresMinutes: number): Promise<void>;
    sendOrderConfirmation(orderId: string): Promise<void>;
    sendOrderDelivered(orderId: string): Promise<void>;
    sendSupportTicketCreated(ticketId: string): Promise<void>;
    sendRefundProcessed(orderId: string): Promise<void>;
    sendGstInvoiceEmail(invoiceId: string, pdf: Buffer, invoiceNumber: string, to: string): Promise<void>;
    sendTestEmail(to: string): Promise<{
        success: boolean;
    }>;
    sendAdminWelcomeEmail(to: string, name: string): Promise<void>;
    sendAdminPasswordResetEmail(to: string, token: string, expiresMinutes: number): Promise<void>;
    sendAdminSecurityAlert(to: string, message: string): Promise<void>;
    sendAdminNewDeviceLogin(to: string, name: string, ipAddress: string): Promise<void>;
    sendMerchantStoreApproved(merchantUserId: string, storeName: string): Promise<void>;
    sendMerchantStoreRejected(merchantUserId: string, storeName: string, reason: string): Promise<void>;
    private safeSend;
    private formatAddress;
}
