import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { getConfig } from '../../config/configuration';
import { EMAIL_TEMPLATE } from './email.constants';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly buyerSiteUrl: string;

  constructor(
    private readonly email: EmailService,
    private readonly templates: EmailTemplateService,
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const cfg = getConfig(configService);
    this.buyerSiteUrl = configService.get<string>('BUYER_SITE_URL', 'https://jebdekho.com');
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
    const tpl = this.templates.welcome(name);
    await this.safeSend({ to, ...tpl, templateCode: EMAIL_TEMPLATE.WELCOME, metadata: { name } });
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

  private async safeSend(input: Parameters<EmailService['send']>[0]): Promise<void> {
    try {
      await this.email.send(input);
    } catch (err) {
      this.logger.error({ err, to: input.to, template: input.templateCode }, 'Email notification failed');
    }
  }

  private formatAddress(raw: unknown): string {
    if (!raw || typeof raw !== 'object') return 'Address on file';
    const a = raw as Record<string, unknown>;
    const parts = [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Address on file';
  }
}
