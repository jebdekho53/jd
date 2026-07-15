import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDeliveryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EMAIL_TEMPLATE } from './email.constants';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly buyerSiteUrl: string;
  private readonly adminSiteUrl: string;
  private readonly merchantSiteUrl: string;
  private readonly franchiseSiteUrl: string;
  private readonly riderSiteUrl: string;
  private readonly adminEmail?: string;

  constructor(
    private readonly email: EmailService,
    private readonly templates: EmailTemplateService,
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.buyerSiteUrl = configService.get<string>('BUYER_SITE_URL', 'https://jebdekho.com');
    this.adminSiteUrl = configService.get<string>('ADMIN_URL', 'https://admin.jebdekho.com');
    this.merchantSiteUrl = configService.get<string>('MERCHANT_URL', 'https://merchant.jebdekho.com');
    this.franchiseSiteUrl = configService.get<string>('FRANCHISE_URL', 'https://franchise.jebdekho.com');
    this.riderSiteUrl = configService.get<string>('RIDER_URL', 'https://rider.jebdekho.com');
    this.adminEmail = configService.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
  }

  async sendOtpEmail(to: string, code: string, expiresInSeconds: number): Promise<void> {
    const expiresMinutes = Math.max(1, Math.round(expiresInSeconds / 60));
    const tpl = this.templates.otp(code, expiresMinutes);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.OTP,
      metadata: { expiresMinutes },
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendBuyerWelcomeEmail(to, name);
  }

  async sendBuyerWelcomeEmail(to: string, name: string, userId?: string): Promise<void> {
    const tpl = this.templates.welcome(name);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.WELCOME,
      metadata: { name, ...(userId ? { userId } : {}) },
    });
  }

  async sendMerchantWelcomeEmail(to: string, name: string, applicationId?: string, cardPng?: Buffer | null): Promise<void> {
    const dashboardUrl = `${this.merchantSiteUrl.replace(/\/$/, '')}/signup`;
    const tpl = this.templates.merchantWelcome(name, dashboardUrl);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.MERCHANT_WELCOME,
      metadata: { name, ...(applicationId ? { applicationId } : {}) },
      ...(cardPng
        ? { attachments: [{ filename: 'jebdekho-store-card.png', content: cardPng, contentType: 'image/png' }] }
        : {}),
    });
  }

  async sendFranchiseWelcomeEmail(data: {
    to?: string | null;
    name: string;
    leadId?: string;
    franchiseId?: string;
    referralCode: string;
    cardPng?: Buffer | null;
  }): Promise<void> {
    if (!data.to) return;
    const merchantBase = this.merchantSiteUrl.replace(/\/$/, '');
    const tpl = this.templates.franchiseWelcome({
      name: data.name,
      referralCode: data.referralCode,
      referralUrl: `${merchantBase}/?ref=${encodeURIComponent(data.referralCode)}`,
      portalUrl: this.franchiseSiteUrl.replace(/\/$/, ''),
    });
    await this.safeSend({
      to: data.to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.FRANCHISE_WELCOME,
      metadata: {
        name: data.name,
        ...(data.leadId ? { leadId: data.leadId } : {}),
        ...(data.franchiseId ? { franchiseId: data.franchiseId } : {}),
        referralCode: data.referralCode,
      },
      ...(data.cardPng
        ? { attachments: [{ filename: 'jebdekho-partner-card.png', content: data.cardPng, contentType: 'image/png' }] }
        : {}),
    });
  }

  async sendRiderWelcomeEmail(to: string | null | undefined, name: string, riderProfileId?: string): Promise<void> {
    if (!to) return;
    const tpl = this.templates.riderWelcome(name, this.riderSiteUrl.replace(/\/$/, ''));
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.RIDER_WELCOME,
      metadata: { name, ...(riderProfileId ? { riderProfileId } : {}) },
    });
  }

  async sendPasswordResetEmail(to: string, token: string, expiresMinutes: number): Promise<void> {
    const resetUrl = `${this.buyerSiteUrl.replace(/\/$/, '')}/forgot-password?token=${token}`;
    const tpl = this.templates.passwordReset(resetUrl, expiresMinutes);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.PASSWORD_RESET,
      metadata: { expiresMinutes },
    });
  }

  async sendOrderConfirmation(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        buyerProfile: { include: { user: { select: { email: true } } } },
      },
    });
    if (!order) return;

    const to = order.buyerProfile.user.email;
    if (!to) return;

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
      templateCode: EMAIL_TEMPLATE.ORDER_CONFIRMATION,
      metadata: { orderId, orderNumber: order.orderNumber },
    });
  }

  async sendOrderDelivered(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerProfile: { include: { user: { select: { email: true } } } } },
    });
    if (!order) return;

    const to = order.buyerProfile.user.email;
    if (!to) return;

    const reviewUrl = `${this.buyerSiteUrl.replace(/\/$/, '')}/orders/${order.id}`;
    const tpl = this.templates.orderDelivered(order.orderNumber, reviewUrl);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.ORDER_DELIVERED,
      metadata: { orderId, orderNumber: order.orderNumber },
    });
  }

  async sendBuyerPaymentSuccess(orderId: string): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Payment Successful - ${ctx.orderNumber}`,
      heading: 'Your payment was successful.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['We have received your payment and your order is being processed.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.PAYMENT_SUCCESS, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendBuyerPaymentFailed(orderId: string): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Payment Failed - ${ctx.orderNumber}`,
      heading: 'Your payment could not be completed.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['Please try again or choose another payment method. Your order will not move ahead until payment succeeds.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.PAYMENT_FAILED, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendBuyerMerchantAccepted(orderId: string): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Merchant Accepted Your Order - ${ctx.orderNumber}`,
      heading: 'The merchant accepted your order.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['Your order is being prepared. We will notify you when delivery is assigned.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_ACCEPTED, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendBuyerMerchantRejectedOrCancelled(orderId: string, reason = 'The merchant could not fulfill this order.'): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Order Cancelled - ${ctx.orderNumber}`,
      heading: 'Your order was cancelled.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: [reason, 'If a payment was captured, the refund process will be started automatically.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.ORDER_REJECTED, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendBuyerDeliveryAssigned(orderId: string): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Delivery Assigned - ${ctx.orderNumber}`,
      heading: 'A delivery partner has been assigned.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['Your order will be picked up soon.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.DELIVERY_ASSIGNED, metadata: { orderNumber: ctx.orderNumber, deliveryState: 'assigned' } });
  }

  async sendBuyerPickedUpOrOutForDelivery(orderId: string): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Order Out For Delivery - ${ctx.orderNumber}`,
      heading: 'Your order is on the way.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['The delivery partner has picked up your order and is heading to you.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.DELIVERY_ASSIGNED, metadata: { orderNumber: ctx.orderNumber, deliveryState: 'picked_up' } });
  }

  async sendSupportTicketCreated(ticketId: string): Promise<void> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        requester: { select: { email: true } },
      },
    });
    if (!ticket?.requester.email) return;

    const tpl = this.templates.supportTicket({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: ticket.category.name,
      description: ticket.description,
    });

    await this.safeSend({
      to: ticket.requester.email,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.SUPPORT_TICKET,
      metadata: { ticketId, ticketNumber: ticket.ticketNumber },
    });
  }

  async sendRefundProcessed(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerProfile: { include: { user: { select: { email: true } } } } },
    });
    if (!order) return;

    const to = order.buyerProfile.user.email;
    if (!to) return;

    const tpl = this.templates.refund({
      orderNumber: order.orderNumber,
      amount: `₹${Number(order.totalAmount).toFixed(2)}`,
      settlementTime: '5–7 business days',
    });

    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.REFUND,
      metadata: { orderId, orderNumber: order.orderNumber },
    });
  }

  async sendRefundInitiated(orderId: string): Promise<void> {
    const ctx = await this.getBuyerOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Refund Initiated - ${ctx.orderNumber}`,
      heading: 'Your refund has been initiated.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['We will notify you once the refund is completed by the payment partner.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.REFUND_INITIATED, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendGstInvoiceEmail(
    invoiceId: string,
    pdf: Buffer,
    invoiceNumber: string,
    to: string,
  ): Promise<void> {
    const tpl = this.templates.gstInvoice(invoiceNumber);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.GST_INVOICE,
      attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdf }],
      metadata: { invoiceId, invoiceNumber },
    });
  }

  async sendTestEmail(to: string): Promise<{ success: boolean }> {
    const tpl = this.templates.test();
    const result = await this.email.send({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.TEST,
    });
    return { success: result.success };
  }

  async sendAdminWelcomeEmail(to: string, name: string): Promise<void> {
    const tpl = this.templates.adminWelcome(name);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.ADMIN_WELCOME,
      metadata: { name },
    });
  }

  async sendAdminPasswordResetEmail(to: string, token: string, expiresMinutes: number): Promise<void> {
    const resetUrl = `${this.adminSiteUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    const tpl = this.templates.adminPasswordReset(resetUrl, expiresMinutes);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.ADMIN_PASSWORD_RESET,
      metadata: { expiresMinutes },
    });
  }

  async sendAdminSecurityAlert(to: string, message: string): Promise<void> {
    const tpl = this.templates.adminSecurityAlert(message);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.ADMIN_SECURITY_ALERT,
      metadata: { message },
    });
  }

  async sendAdminNewDeviceLogin(to: string, name: string, ipAddress: string): Promise<void> {
    const tpl = this.templates.adminNewDeviceLogin(name, ipAddress);
    await this.safeSend({
      to,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.ADMIN_NEW_DEVICE,
      metadata: { ipAddress },
    });
  }

  async sendMerchantStoreApproved(merchantUserId: string, storeName: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: merchantUserId },
      select: { email: true },
    });
    if (!user?.email) return;
    const dashboardUrl = `${this.merchantSiteUrl.replace(/\/$/, '')}/stores`;
    const tpl = this.templates.merchantApproved(storeName, dashboardUrl);
    await this.safeSend({
      to: user.email,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.MERCHANT_APPROVED,
      metadata: { storeName },
    });
  }

  async sendMerchantStoreRejected(merchantUserId: string, storeName: string, reason: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: merchantUserId },
      select: { email: true },
    });
    if (!user?.email) return;
    const dashboardUrl = `${this.merchantSiteUrl.replace(/\/$/, '')}/signup`;
    const tpl = this.templates.merchantRejected(storeName, reason, dashboardUrl);
    await this.safeSend({
      to: user.email,
      ...tpl,
      templateCode: EMAIL_TEMPLATE.MERCHANT_REJECTED,
      metadata: { storeName, reason },
    });
  }

  async sendMerchantApplicationReceived(to: string, businessName: string): Promise<void> {
    const tpl = this.templates.eventNotice({
      subject: 'JebDekho merchant application received',
      heading: 'We received your merchant application.',
      referenceLabel: 'Business',
      referenceValue: businessName,
      lines: ['Our team will review your details and documents. We will email you with the next update.'],
    });
    await this.safeSend({ to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_APPLICATION_RECEIVED, metadata: { businessName } });
  }

  async sendMerchantMoreDocumentsRequired(to: string, businessName: string): Promise<void> {
    const tpl = this.templates.eventNotice({
      subject: 'More documents required for your JebDekho application',
      heading: 'We need more information to continue your review.',
      referenceLabel: 'Business',
      referenceValue: businessName,
      lines: ['Please check your merchant dashboard and upload the requested documents.'],
    });
    await this.safeSend({ to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_MORE_DOCS_REQUIRED, metadata: { businessName } });
  }

  async sendMerchantNewOrder(orderId: string): Promise<void> {
    const ctx = await this.getMerchantOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `New Order Received - ${ctx.orderNumber}`,
      heading: 'You have a new order.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['Please accept or reject the order from your merchant dashboard.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_NEW_ORDER, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendMerchantOrderCancelled(orderId: string): Promise<void> {
    const ctx = await this.getMerchantOrderContext(orderId);
    if (!ctx) return;
    const tpl = this.templates.eventNotice({
      subject: `Order Cancelled - ${ctx.orderNumber}`,
      heading: 'An order was cancelled.',
      referenceLabel: 'Order Number',
      referenceValue: ctx.orderNumber,
      lines: ['No further preparation is required for this order.'],
    });
    await this.safeSend({ to: ctx.to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_ORDER_CANCELLED, metadata: { orderNumber: ctx.orderNumber } });
  }

  async sendMerchantSettlementInitiated(to: string, settlementReference: string, amount: string): Promise<void> {
    const tpl = this.templates.eventNotice({
      subject: `Settlement Initiated - ${settlementReference}`,
      heading: 'Your settlement has been initiated.',
      referenceLabel: 'Settlement Reference',
      referenceValue: settlementReference,
      lines: [`Amount: ${amount}`, 'We will notify you once the settlement is completed.'],
    });
    await this.safeSend({ to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_SETTLEMENT_INITIATED, metadata: { settlementReference } });
  }

  async sendMerchantSettlementCompleted(to: string, settlementReference: string, amount: string): Promise<void> {
    const tpl = this.templates.eventNotice({
      subject: `Settlement Completed - ${settlementReference}`,
      heading: 'Your settlement has been completed.',
      referenceLabel: 'Settlement Reference',
      referenceValue: settlementReference,
      lines: [`Amount: ${amount}`, 'The settlement should reflect in your registered bank account as per banking timelines.'],
    });
    await this.safeSend({ to, ...tpl, templateCode: EMAIL_TEMPLATE.MERCHANT_SETTLEMENT_COMPLETED, metadata: { settlementReference } });
  }

  async sendAdminNewMerchantApplication(businessName: string, ownerEmail?: string): Promise<void> {
    await this.sendAdminNotice(EMAIL_TEMPLATE.ADMIN_NEW_MERCHANT_APPLICATION, 'New merchant application', 'A new merchant application was submitted.', [
      `Business: ${businessName}`,
      ownerEmail ? `Owner Email: ${ownerEmail}` : 'Owner Email: not provided',
    ]);
  }

  async sendAdminMerchantDocumentsSubmitted(businessName: string): Promise<void> {
    await this.sendAdminNotice(EMAIL_TEMPLATE.ADMIN_DOCUMENTS_SUBMITTED, 'Merchant documents submitted', 'Merchant documents were submitted for review.', [`Business: ${businessName}`]);
  }

  async sendAdminRefundRequest(orderNumber: string, amount: string): Promise<void> {
    await this.sendAdminNotice(EMAIL_TEMPLATE.ADMIN_REFUND_REQUEST, `Refund request raised - ${orderNumber}`, 'A refund request was raised.', [`Order Number: ${orderNumber}`, `Amount: ${amount}`]);
  }

  async sendAdminDeliveryFailedOrDelayed(orderNumber: string): Promise<void> {
    await this.sendAdminNotice(EMAIL_TEMPLATE.ADMIN_DELIVERY_FAILED_DELAYED, `Delivery issue - ${orderNumber}`, 'A delivery has failed or is delayed.', [`Order Number: ${orderNumber}`]);
  }

  async sendAdminRepeatedPaymentFailure(paymentReference: string): Promise<void> {
    await this.sendAdminNotice(EMAIL_TEMPLATE.ADMIN_REPEATED_PAYMENT_FAILURE, `Repeated payment failure - ${paymentReference}`, 'Repeated payment failures were detected.', [`Payment Reference: ${paymentReference}`]);
  }

  async sendAdminSupportTicketCreated(ticketNumber: string): Promise<void> {
    await this.sendAdminNotice(EMAIL_TEMPLATE.ADMIN_SUPPORT_TICKET_CREATED, `Support ticket created - ${ticketNumber}`, 'A support ticket was created.', [`Ticket Number: ${ticketNumber}`]);
  }

  private async safeSend(input: Parameters<EmailService['send']>[0]): Promise<void> {
    try {
      if (await this.alreadyQueuedOrSent(input)) return;
      await this.email.send(input);
    } catch (err) {
      this.logger.error({ err, to: input.to, template: input.templateCode }, 'Email notification failed');
    }
  }

  private async sendAdminNotice(templateCode: typeof EMAIL_TEMPLATE[keyof typeof EMAIL_TEMPLATE], subject: string, heading: string, lines: string[]): Promise<void> {
    if (!this.adminEmail) return;
    const tpl = this.templates.eventNotice({ subject, heading, lines });
    await this.safeSend({ to: this.adminEmail, ...tpl, templateCode, metadata: { subject } });
  }

  private async alreadyQueuedOrSent(input: Parameters<EmailService['send']>[0]): Promise<boolean> {
    if (!input.templateCode) return false;
    const existing = await this.prisma.emailLog.findFirst({
      where: {
        recipient: input.to,
        subject: input.subject,
        templateCode: input.templateCode,
        status: { in: [EmailDeliveryStatus.PENDING, EmailDeliveryStatus.SENT] },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  private async getBuyerOrderContext(orderId: string): Promise<{ to: string; orderNumber: string } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerProfile: { include: { user: { select: { email: true } } } } },
    });
    const to = order?.buyerProfile.user.email;
    return order && to ? { to, orderNumber: order.orderNumber } : null;
  }

  private async getMerchantOrderContext(orderId: string): Promise<{ to: string; orderNumber: string } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { include: { merchantProfile: { include: { user: { select: { email: true } } } } } },
      },
    });
    const to = order?.store?.merchantProfile?.user?.email;
    return order && to ? { to, orderNumber: order.orderNumber } : null;
  }

  private formatAddress(raw: unknown): string {
    if (!raw || typeof raw !== 'object') return 'Address on file';
    const a = raw as Record<string, unknown>;
    const parts = [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Address on file';
  }
}
