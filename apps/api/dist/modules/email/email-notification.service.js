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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
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
        this.adminEmail = configService.get('ADMIN_EMAIL')?.trim().toLowerCase();
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
    async sendBuyerPaymentSuccess(orderId) {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Payment Successful - ${ctx.orderNumber}`,
            heading: 'Your payment was successful.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['We have received your payment and your order is being processed.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.PAYMENT_SUCCESS, metadata: { orderNumber: ctx.orderNumber } });
    }
    async sendBuyerPaymentFailed(orderId) {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Payment Failed - ${ctx.orderNumber}`,
            heading: 'Your payment could not be completed.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['Please try again or choose another payment method. Your order will not move ahead until payment succeeds.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.PAYMENT_FAILED, metadata: { orderNumber: ctx.orderNumber } });
    }
    async sendBuyerMerchantAccepted(orderId) {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Merchant Accepted Your Order - ${ctx.orderNumber}`,
            heading: 'The merchant accepted your order.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['Your order is being prepared. We will notify you when delivery is assigned.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_ACCEPTED, metadata: { orderNumber: ctx.orderNumber } });
    }
    async sendBuyerMerchantRejectedOrCancelled(orderId, reason = 'The merchant could not fulfill this order.') {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Order Cancelled - ${ctx.orderNumber}`,
            heading: 'Your order was cancelled.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: [reason, 'If a payment was captured, the refund process will be started automatically.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.ORDER_REJECTED, metadata: { orderNumber: ctx.orderNumber } });
    }
    async sendBuyerDeliveryAssigned(orderId) {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Delivery Assigned - ${ctx.orderNumber}`,
            heading: 'A delivery partner has been assigned.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['Your order will be picked up soon.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.DELIVERY_ASSIGNED, metadata: { orderNumber: ctx.orderNumber, deliveryState: 'assigned' } });
    }
    async sendBuyerPickedUpOrOutForDelivery(orderId) {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Order Out For Delivery - ${ctx.orderNumber}`,
            heading: 'Your order is on the way.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['The delivery partner has picked up your order and is heading to you.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.DELIVERY_ASSIGNED, metadata: { orderNumber: ctx.orderNumber, deliveryState: 'picked_up' } });
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
    async sendRefundInitiated(orderId) {
        const ctx = await this.getBuyerOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Refund Initiated - ${ctx.orderNumber}`,
            heading: 'Your refund has been initiated.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['We will notify you once the refund is completed by the payment partner.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.REFUND_INITIATED, metadata: { orderNumber: ctx.orderNumber } });
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
    async sendMerchantApplicationReceived(to, businessName) {
        const tpl = this.templates.eventNotice({
            subject: 'JebDekho merchant application received',
            heading: 'We received your merchant application.',
            referenceLabel: 'Business',
            referenceValue: businessName,
            lines: ['Our team will review your details and documents. We will email you with the next update.'],
        });
        await this.safeSend({ to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_APPLICATION_RECEIVED, metadata: { businessName } });
    }
    async sendMerchantMoreDocumentsRequired(to, businessName) {
        const tpl = this.templates.eventNotice({
            subject: 'More documents required for your JebDekho application',
            heading: 'We need more information to continue your review.',
            referenceLabel: 'Business',
            referenceValue: businessName,
            lines: ['Please check your merchant dashboard and upload the requested documents.'],
        });
        await this.safeSend({ to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_MORE_DOCS_REQUIRED, metadata: { businessName } });
    }
    async sendMerchantNewOrder(orderId) {
        const ctx = await this.getMerchantOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `New Order Received - ${ctx.orderNumber}`,
            heading: 'You have a new order.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['Please accept or reject the order from your merchant dashboard.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_NEW_ORDER, metadata: { orderNumber: ctx.orderNumber } });
    }
    async sendMerchantOrderCancelled(orderId) {
        const ctx = await this.getMerchantOrderContext(orderId);
        if (!ctx)
            return;
        const tpl = this.templates.eventNotice({
            subject: `Order Cancelled - ${ctx.orderNumber}`,
            heading: 'An order was cancelled.',
            referenceLabel: 'Order Number',
            referenceValue: ctx.orderNumber,
            lines: ['No further preparation is required for this order.'],
        });
        await this.safeSend({ to: ctx.to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_ORDER_CANCELLED, metadata: { orderNumber: ctx.orderNumber } });
    }
    async sendMerchantSettlementInitiated(to, settlementReference, amount) {
        const tpl = this.templates.eventNotice({
            subject: `Settlement Initiated - ${settlementReference}`,
            heading: 'Your settlement has been initiated.',
            referenceLabel: 'Settlement Reference',
            referenceValue: settlementReference,
            lines: [`Amount: ${amount}`, 'We will notify you once the settlement is completed.'],
        });
        await this.safeSend({ to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_SETTLEMENT_INITIATED, metadata: { settlementReference } });
    }
    async sendMerchantSettlementCompleted(to, settlementReference, amount) {
        const tpl = this.templates.eventNotice({
            subject: `Settlement Completed - ${settlementReference}`,
            heading: 'Your settlement has been completed.',
            referenceLabel: 'Settlement Reference',
            referenceValue: settlementReference,
            lines: [`Amount: ${amount}`, 'The settlement should reflect in your registered bank account as per banking timelines.'],
        });
        await this.safeSend({ to, ...tpl, templateCode: email_constants_1.EMAIL_TEMPLATE.MERCHANT_SETTLEMENT_COMPLETED, metadata: { settlementReference } });
    }
    async sendAdminNewMerchantApplication(businessName, ownerEmail) {
        await this.sendAdminNotice(email_constants_1.EMAIL_TEMPLATE.ADMIN_NEW_MERCHANT_APPLICATION, 'New merchant application', 'A new merchant application was submitted.', [
            `Business: ${businessName}`,
            ownerEmail ? `Owner Email: ${ownerEmail}` : 'Owner Email: not provided',
        ]);
    }
    async sendAdminMerchantDocumentsSubmitted(businessName) {
        await this.sendAdminNotice(email_constants_1.EMAIL_TEMPLATE.ADMIN_DOCUMENTS_SUBMITTED, 'Merchant documents submitted', 'Merchant documents were submitted for review.', [`Business: ${businessName}`]);
    }
    async sendAdminRefundRequest(orderNumber, amount) {
        await this.sendAdminNotice(email_constants_1.EMAIL_TEMPLATE.ADMIN_REFUND_REQUEST, `Refund request raised - ${orderNumber}`, 'A refund request was raised.', [`Order Number: ${orderNumber}`, `Amount: ${amount}`]);
    }
    async sendAdminDeliveryFailedOrDelayed(orderNumber) {
        await this.sendAdminNotice(email_constants_1.EMAIL_TEMPLATE.ADMIN_DELIVERY_FAILED_DELAYED, `Delivery issue - ${orderNumber}`, 'A delivery has failed or is delayed.', [`Order Number: ${orderNumber}`]);
    }
    async sendAdminRepeatedPaymentFailure(paymentReference) {
        await this.sendAdminNotice(email_constants_1.EMAIL_TEMPLATE.ADMIN_REPEATED_PAYMENT_FAILURE, `Repeated payment failure - ${paymentReference}`, 'Repeated payment failures were detected.', [`Payment Reference: ${paymentReference}`]);
    }
    async sendAdminSupportTicketCreated(ticketNumber) {
        await this.sendAdminNotice(email_constants_1.EMAIL_TEMPLATE.ADMIN_SUPPORT_TICKET_CREATED, `Support ticket created - ${ticketNumber}`, 'A support ticket was created.', [`Ticket Number: ${ticketNumber}`]);
    }
    async safeSend(input) {
        try {
            if (await this.alreadyQueuedOrSent(input))
                return;
            await this.email.send(input);
        }
        catch (err) {
            this.logger.error({ err, to: input.to, template: input.templateCode }, 'Email notification failed');
        }
    }
    async sendAdminNotice(templateCode, subject, heading, lines) {
        if (!this.adminEmail)
            return;
        const tpl = this.templates.eventNotice({ subject, heading, lines });
        await this.safeSend({ to: this.adminEmail, ...tpl, templateCode, metadata: { subject } });
    }
    async alreadyQueuedOrSent(input) {
        if (!input.templateCode)
            return false;
        const existing = await this.prisma.emailLog.findFirst({
            where: {
                recipient: input.to,
                subject: input.subject,
                templateCode: input.templateCode,
                status: { in: [client_1.EmailDeliveryStatus.PENDING, client_1.EmailDeliveryStatus.SENT] },
            },
            select: { id: true },
        });
        return Boolean(existing);
    }
    async getBuyerOrderContext(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { buyerProfile: { include: { user: { select: { email: true } } } } },
        });
        const to = order?.buyerProfile.user.email;
        return order && to ? { to, orderNumber: order.orderNumber } : null;
    }
    async getMerchantOrderContext(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: { include: { merchantProfile: { include: { user: { select: { email: true } } } } } },
            },
        });
        const to = order?.store?.merchantProfile?.user?.email;
        return order && to ? { to, orderNumber: order.orderNumber } : null;
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
        prisma_service_1.PrismaService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], EmailNotificationService);
//# sourceMappingURL=email-notification.service.js.map