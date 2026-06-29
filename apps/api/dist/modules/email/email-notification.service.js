"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const email_constants_1 = require("./email.constants");
const email_service_1 = require("./email.service");
const email_template_service_1 = require("./email-template.service");
let EmailNotificationService = EmailNotificationService_1 = class EmailNotificationService {
    constructor(email, templates, prisma, configService) {
        this.email = email;
        this.templates = templates;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailNotificationService_1.name);
        this.buyerSiteUrl = configService.get('BUYER_SITE_URL', 'https://jebdekho.com');
        this.adminSiteUrl = configService.get('ADMIN_URL', 'https://admin.jebdekho.com');
        this.merchantSiteUrl = configService.get('MERCHANT_URL', 'https://merchant.jebdekho.com');
    }
    async sendOtpEmail(to, code, expiresInSeconds) {
        const expiresMinutes = Math.max(1, Math.round(expiresInSeconds / 60));
        const tpl = this.templates.otp(code, expiresMinutes);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.OTP,
            metadata: { expiresMinutes },
        });
    }
    async sendWelcomeEmail(to, name) {
        const tpl = this.templates.welcome(name);
        await this.safeSend({ to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.WELCOME, metadata: { name } });
    }
    async sendPasswordResetEmail(to, token, expiresMinutes) {
        const resetUrl = `${this.buyerSiteUrl.replace(/\/$/, '')}/forgot-password?token=${token}`;
        const tpl = this.templates.passwordReset(resetUrl, expiresMinutes);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.PASSWORD_RESET,
            metadata: { expiresMinutes },
        });
    }
    async sendOrderConfirmation(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                buyerProfile: { include: { user: { select: { email: true } } } },
            },
        });
        if (!order)
            return;
        const to = order.buyerProfile.user.email;
        if (!to)
            return;
        const address = this.formatAddress(order.deliveryAddress);
        const tpl = this.templates.orderConfirmation({
            orderNumber: order.orderNumber,
            items: order.items.map((i) => ({
                name: `${i.productName}${i.variantName ? ` (${i.variantName})` : ''}`,
                qty: i.quantity,
                price: `₹${Number(i.unitPrice).toFixed(2)}`,
            })),
            total: `₹${Number(order.totalAmount).toFixed(2)}`,
            paymentMethod: order.paymentMethod,
            address,
        });
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.ORDER_CONFIRMATION,
            metadata: { orderId, orderNumber: order.orderNumber },
        });
    }
    async sendOrderDelivered(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { buyerProfile: { include: { user: { select: { email: true } } } } },
        });
        if (!order)
            return;
        const to = order.buyerProfile.user.email;
        if (!to)
            return;
        const reviewUrl = `${this.buyerSiteUrl.replace(/\/$/, '')}/orders/${order.id}`;
        const tpl = this.templates.orderDelivered(order.orderNumber, reviewUrl);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.ORDER_DELIVERED,
            metadata: { orderId, orderNumber: order.orderNumber },
        });
    }
    async sendSupportTicketCreated(ticketId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                category: true,
                requester: { select: { email: true } },
            },
        });
        if (!ticket?.requester.email)
            return;
        const tpl = this.templates.supportTicket({
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            category: ticket.category.name,
            description: ticket.description,
        });
        await this.safeSend({
            to: ticket.requester.email,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.SUPPORT_TICKET,
            metadata: { ticketId, ticketNumber: ticket.ticketNumber },
        });
    }
    async sendRefundProcessed(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { buyerProfile: { include: { user: { select: { email: true } } } } },
        });
        if (!order)
            return;
        const to = order.buyerProfile.user.email;
        if (!to)
            return;
        const tpl = this.templates.refund({
            orderNumber: order.orderNumber,
            amount: `₹${Number(order.totalAmount).toFixed(2)}`,
            settlementTime: '5–7 business days',
        });
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.REFUND,
            metadata: { orderId, orderNumber: order.orderNumber },
        });
    }
    async sendGstInvoiceEmail(invoiceId, pdf, invoiceNumber, to) {
        const tpl = this.templates.gstInvoice(invoiceNumber);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.GST_INVOICE,
            attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdf }],
            metadata: { invoiceId, invoiceNumber },
        });
    }
    async sendTestEmail(to) {
        const tpl = this.templates.test();
        const result = await this.email.send({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.TEST,
        });
        return { success: result.success };
    }
    async sendAdminWelcomeEmail(to, name) {
        const tpl = this.templates.adminWelcome(name);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.ADMIN_WELCOME,
            metadata: { name },
        });
    }
    async sendAdminPasswordResetEmail(to, token, expiresMinutes) {
        const resetUrl = `${this.adminSiteUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
        const tpl = this.templates.adminPasswordReset(resetUrl, expiresMinutes);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.ADMIN_PASSWORD_RESET,
            metadata: { expiresMinutes },
        });
    }
    async sendAdminSecurityAlert(to, message) {
        const tpl = this.templates.adminSecurityAlert(message);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.ADMIN_SECURITY_ALERT,
            metadata: { message },
        });
    }
    async sendAdminNewDeviceLogin(to, name, ipAddress) {
        const tpl = this.templates.adminNewDeviceLogin(name, ipAddress);
        await this.safeSend({
            to,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.ADMIN_NEW_DEVICE,
            metadata: { ipAddress },
        });
    }
    async sendMerchantStoreApproved(merchantUserId, storeName) {
        const user = await this.prisma.user.findUnique({
            where: { id: merchantUserId },
            select: { email: true },
        });
        if (!user?.email)
            return;
        const dashboardUrl = `${this.merchantSiteUrl.replace(/\/$/, '')}/stores`;
        const tpl = this.templates.merchantApproved(storeName, dashboardUrl);
        await this.safeSend({
            to: user.email,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_APPROVED,
            metadata: { storeName },
        });
    }
    async sendMerchantStoreRejected(merchantUserId, storeName, reason) {
        const user = await this.prisma.user.findUnique({
            where: { id: merchantUserId },
            select: { email: true },
        });
        if (!user?.email)
            return;
        const dashboardUrl = `${this.merchantSiteUrl.replace(/\/$/, '')}/signup`;
        const tpl = this.templates.merchantRejected(storeName, reason, dashboardUrl);
        await this.safeSend({
            to: user.email,
            ...tpl,
            templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_REJECTED,
            metadata: { storeName, reason },
        });
    }
    async safeSend(input) {
        try {
            await this.email.send(input);
        }
        catch (err) {
            this.logger.error({ err, to: input.to, template: input.templateCode }, 'Email notification failed');
        }
    }
    formatAddress(raw) {
        if (!raw || typeof raw !== 'object')
            return 'Address on file';
        const a = raw;
        const parts = [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean);
        return parts.length ? parts.join(', ') : 'Address on file';
    }
};
exports.EmailNotificationService = EmailNotificationService;
exports.EmailNotificationService = EmailNotificationService = EmailNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        email_template_service_1.EmailTemplateService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], EmailNotificationService);
//# sourceMappingURL=email-notification.service.js.map