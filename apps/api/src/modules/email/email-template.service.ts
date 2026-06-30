import { Injectable } from '@nestjs/common';
import { EMAIL_COLORS, EMAIL_LOGO_URL } from './email.constants';

@Injectable()
export class EmailTemplateService {
  layout(title: string, bodyHtml: string, preheader?: string): string {
    const { primary, secondary, muted, background, white } = EMAIL_COLORS;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${this.escape(title)}</title>
  ${preheader ? `<meta name="x-preheader" content="${this.escape(preheader)}" />` : ''}
  <style>
    body { margin: 0; padding: 0; background: ${background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${secondary}; }
    .wrap { width: 100%; padding: 24px 12px; }
    .card { max-width: 560px; margin: 0 auto; background: ${white}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(15,23,42,0.08); }
    .header { background: ${secondary}; padding: 24px; text-align: center; }
    .header img { height: 48px; width: auto; }
    .content { padding: 28px 24px; line-height: 1.6; font-size: 15px; }
    .footer { padding: 0 24px 24px; color: ${muted}; font-size: 12px; text-align: center; }
    .btn { display: inline-block; background: ${primary}; color: #fff !important; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; margin-top: 16px; }
    .otp { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${primary}; text-align: center; margin: 20px 0; }
    .list { margin: 16px 0; padding-left: 0; list-style: none; }
    .list li { margin: 8px 0; }
    .muted { color: ${muted}; font-size: 13px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    table.items th, table.items td { padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: left; }
    table.items th { color: ${muted}; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    @media (max-width: 600px) {
      .content { padding: 22px 16px; }
      .otp { font-size: 28px; letter-spacing: 6px; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader ? this.escape(preheader) : ''}</div>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <img src="${EMAIL_LOGO_URL}" alt="JebDekho" />
      </div>
      <div class="content">${bodyHtml}</div>
      <div class="footer">This is an automated message from JebDekho. For help, contact support@jebdekho.com.</div>
    </div>
  </div>
</body>
</html>`;
  }

  otp(code: string, expiresMinutes: number): { subject: string; html: string; text: string } {
    const subject = 'Your JebDekho Verification Code';
    const body = `
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <div class="otp">${this.escape(code)}</div>
      <p class="muted">This code expires in ${expiresMinutes} minutes.</p>
      <p class="muted">If you did not request this code, please ignore this email.</p>
      <p>Team JebDekho</p>`;
    const text = `Hello,\n\nYour verification code is: ${code}\n\nThis code expires in ${expiresMinutes} minutes.\n\nIf you did not request this code, please ignore this email.\n\nTeam JebDekho`;
    return { subject, html: this.layout(subject, body, `Your code is ${code}`), text };
  }

  welcome(name: string): { subject: string; html: string; text: string } {
    const subject = 'Welcome to JebDekho 🎉';
    const body = `
      <p>Hi ${this.escape(name)},</p>
      <p>Welcome to JebDekho.</p>
      <p>You can now:</p>
      <ul class="list">
        <li>✓ Order from nearby stores</li>
        <li>✓ Earn rewards</li>
        <li>✓ Get cashback offers</li>
        <li>✓ Track deliveries live</li>
      </ul>
      <p>We are excited to have you.</p>
      <p>Team JebDekho</p>`;
    const text = `Hi ${name},\n\nWelcome to JebDekho.\n\nYou can now order from nearby stores, earn rewards, get cashback offers, and track deliveries live.\n\nWe are excited to have you.\n\nTeam JebDekho`;
    return { subject, html: this.layout(subject, body, 'Welcome to JebDekho'), text };
  }

  orderConfirmation(data: {
    orderNumber: string;
    items: Array<{ name: string; qty: number; price: string }>;
    total: string;
    paymentMethod: string;
    address: string;
  }): { subject: string; html: string; text: string } {
    const subject = `Order Confirmed - ${data.orderNumber}`;
    const rows = data.items
      .map(
        (i) =>
          `<tr><td>${this.escape(i.name)}</td><td>${i.qty}</td><td>${this.escape(i.price)}</td></tr>`,
      )
      .join('');
    const body = `
      <p>Your order has been confirmed.</p>
      <p><strong>Order Number:</strong> ${this.escape(data.orderNumber)}</p>
      <table class="items">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p><strong>Amount:</strong> ${this.escape(data.total)}</p>
      <p><strong>Payment Method:</strong> ${this.escape(data.paymentMethod)}</p>
      <p><strong>Delivery Address:</strong><br/>${this.escape(data.address)}</p>
      <p>Team JebDekho</p>`;
    const text = `Order Confirmed - ${data.orderNumber}\nAmount: ${data.total}\nPayment: ${data.paymentMethod}\nAddress: ${data.address}`;
    return { subject, html: this.layout(subject, body, `Order ${data.orderNumber} confirmed`), text };
  }

  orderDelivered(orderNumber: string, reviewUrl: string): { subject: string; html: string; text: string } {
    const subject = 'Your Order Has Been Delivered';
    const body = `
      <p>Great news! Your order <strong>${this.escape(orderNumber)}</strong> has been delivered.</p>
      <p>We hope you enjoyed your purchase. Please take a moment to rate your experience and share feedback.</p>
      <a class="btn" href="${this.escape(reviewUrl)}">Rate your order</a>
      <p class="muted" style="margin-top:20px;">Your feedback helps local stores improve.</p>
      <p>Team JebDekho</p>`;
    const text = `Your order ${orderNumber} has been delivered. Rate your order: ${reviewUrl}`;
    return { subject, html: this.layout(subject, body, 'Your order was delivered'), text };
  }

  eventNotice(data: {
    subject: string;
    heading: string;
    lines: string[];
    referenceLabel?: string;
    referenceValue?: string;
    actionLabel?: string;
    actionUrl?: string;
  }): { subject: string; html: string; text: string } {
    const reference =
      data.referenceLabel && data.referenceValue
        ? `<p><strong>${this.escape(data.referenceLabel)}:</strong> ${this.escape(data.referenceValue)}</p>`
        : '';
    const lines = data.lines.map((line) => `<p>${this.escape(line)}</p>`).join('');
    const action =
      data.actionLabel && data.actionUrl
        ? `<a class="btn" href="${this.escape(data.actionUrl)}">${this.escape(data.actionLabel)}</a>`
        : '';
    const body = `
      <p><strong>${this.escape(data.heading)}</strong></p>
      ${reference}
      ${lines}
      ${action}
      <p>Team JebDekho</p>`;
    const text = [
      data.heading,
      data.referenceLabel && data.referenceValue
        ? `${data.referenceLabel}: ${data.referenceValue}`
        : undefined,
      ...data.lines,
      data.actionUrl ? `${data.actionLabel ?? 'Open'}: ${data.actionUrl}` : undefined,
      'Team JebDekho',
    ]
      .filter(Boolean)
      .join('\n\n');
    return { subject: data.subject, html: this.layout(data.subject, body, data.heading), text };
  }

  passwordReset(resetUrl: string, expiresMinutes: number): { subject: string; html: string; text: string } {
    const subject = 'Reset Your Password';
    const body = `
      <p>We received a request to reset your JebDekho password.</p>
      <a class="btn" href="${this.escape(resetUrl)}">Reset Password</a>
      <p class="muted">This link expires in ${expiresMinutes} minutes.</p>
      <p class="muted">If you did not request a password reset, you can safely ignore this email.</p>
      <p>Team JebDekho</p>`;
    const text = `Reset your password: ${resetUrl}\n\nThis link expires in ${expiresMinutes} minutes.`;
    return { subject, html: this.layout(subject, body, 'Reset your JebDekho password'), text };
  }

  supportTicket(data: {
    ticketNumber: string;
    subject: string;
    category: string;
    description: string;
  }): { subject: string; html: string; text: string } {
    const subject = `Support Ticket Created - ${data.ticketNumber}`;
    const body = `
      <p>We've received your support request.</p>
      <p><strong>Ticket:</strong> ${this.escape(data.ticketNumber)}</p>
      <p><strong>Category:</strong> ${this.escape(data.category)}</p>
      <p><strong>Subject:</strong> ${this.escape(data.subject)}</p>
      <p><strong>Details:</strong><br/>${this.escape(data.description)}</p>
      <p>Our team will respond shortly.</p>
      <p>Team JebDekho</p>`;
    const text = `Support ticket ${data.ticketNumber} created: ${data.subject}`;
    return { subject, html: this.layout(subject, body, `Ticket ${data.ticketNumber} created`), text };
  }

  refund(data: {
    orderNumber: string;
    amount: string;
    settlementTime: string;
  }): { subject: string; html: string; text: string } {
    const subject = 'Refund Processed';
    const body = `
      <p>Your refund has been processed.</p>
      <p><strong>Order Number:</strong> ${this.escape(data.orderNumber)}</p>
      <p><strong>Refund Amount:</strong> ${this.escape(data.amount)}</p>
      <p><strong>Expected Settlement:</strong> ${this.escape(data.settlementTime)}</p>
      <p>Team JebDekho</p>`;
    const text = `Refund processed for order ${data.orderNumber}: ${data.amount}`;
    return { subject, html: this.layout(subject, body, 'Your refund has been processed'), text };
  }

  gstInvoice(invoiceNumber: string): { subject: string; html: string; text: string } {
    const subject = `GST Invoice - ${invoiceNumber}`;
    const body = `
      <p>Please find your GST invoice attached.</p>
      <p><strong>Invoice Number:</strong> ${this.escape(invoiceNumber)}</p>
      <p>Thank you for shopping with JebDekho.</p>
      <p>Team JebDekho</p>`;
    const text = `GST Invoice ${invoiceNumber} is attached.`;
    return { subject, html: this.layout(subject, body, `Invoice ${invoiceNumber}`), text };
  }

  test(): { subject: string; html: string; text: string } {
    const subject = 'JebDekho Email System Test';
    const body = `
      <p>This is a test email from the JebDekho production email system.</p>
      <p>If you received this, SMTP is configured correctly.</p>
      <p>Team JebDekho</p>`;
    const text = 'JebDekho email system test — SMTP is working.';
    return { subject, html: this.layout(subject, body, 'SMTP test successful'), text };
  }

  adminWelcome(name: string): { subject: string; html: string; text: string } {
    const subject = 'Welcome to JebDekho Admin Control Tower';
    const body = `
      <p>Hi ${this.escape(name)},</p>
      <p>Your administrator account is ready. You can sign in to the Admin Control Tower to manage stores, orders, finance, compliance, and platform operations.</p>
      <p class="muted">For security, change your password after first login if you used bootstrap credentials.</p>
      <p>JebDekho Platform Security</p>`;
    const text = `Hi ${name},\n\nYour JebDekho admin account is ready. Sign in at the Admin Control Tower.\n\nJebDekho Platform Security`;
    return { subject, html: this.layout(subject, body, 'Your admin account is ready'), text };
  }

  adminPasswordReset(resetUrl: string, expiresMinutes: number): { subject: string; html: string; text: string } {
    const subject = 'Reset Your Admin Password';
    const body = `
      <p>We received a request to reset your JebDekho admin password.</p>
      <a class="btn" href="${this.escape(resetUrl)}">Reset Admin Password</a>
      <p class="muted">This link expires in ${expiresMinutes} minutes and can only be used once.</p>
      <p class="muted">If you did not request this, contact platform security immediately.</p>
      <p>JebDekho Platform Security</p>`;
    const text = `Reset your admin password: ${resetUrl}\n\nExpires in ${expiresMinutes} minutes.`;
    return { subject, html: this.layout(subject, body, 'Reset your admin password'), text };
  }

  adminSecurityAlert(message: string): { subject: string; html: string; text: string } {
    const subject = 'JebDekho Admin Security Alert';
    const body = `
      <p><strong>Security notice</strong></p>
      <p>${this.escape(message)}</p>
      <p class="muted">If this was not you, reset your password and revoke all sessions from Admin Settings.</p>
      <p>JebDekho Platform Security</p>`;
    const text = `Security alert: ${message}`;
    return { subject, html: this.layout(subject, body, 'Admin security alert'), text };
  }

  adminNewDeviceLogin(name: string, ipAddress: string): { subject: string; html: string; text: string } {
    const subject = 'New Admin Login Detected';
    const body = `
      <p>Hi ${this.escape(name)},</p>
      <p>A new sign-in to your admin account was detected.</p>
      <p><strong>IP Address:</strong> ${this.escape(ipAddress)}</p>
      <p class="muted">If this was you, no action is needed. Otherwise, change your password and log out all devices.</p>
      <p>JebDekho Platform Security</p>`;
    const text = `New admin login for ${name} from ${ipAddress}`;
    return { subject, html: this.layout(subject, body, 'New admin login detected'), text };
  }

  merchantApproved(storeName: string, dashboardUrl: string): { subject: string; html: string; text: string } {
    const subject = 'Your JebDekho store is approved!';
    const body = `
      <p>Great news — <strong>${this.escape(storeName)}</strong> is now live on JebDekho.</p>
      <p>Customers can discover your store, place orders, and track deliveries.</p>
      <a class="btn" href="${this.escape(dashboardUrl)}">Open Merchant Dashboard</a>
      <p class="muted">Complete your catalog and delivery coverage to maximize orders.</p>
      <p>Team JebDekho</p>`;
    const text = `Your store ${storeName} is approved. Dashboard: ${dashboardUrl}`;
    return { subject, html: this.layout(subject, body, `${storeName} is live`), text };
  }

  merchantRejected(storeName: string, reason: string, dashboardUrl: string): { subject: string; html: string; text: string } {
    const subject = 'JebDekho store application update';
    const body = `
      <p>We reviewed <strong>${this.escape(storeName)}</strong> and could not approve it at this time.</p>
      <p><strong>Reason:</strong> ${this.escape(reason)}</p>
      <p>You can update your application and resubmit from the merchant dashboard.</p>
      <a class="btn" href="${this.escape(dashboardUrl)}">Review Application</a>
      <p>Team JebDekho</p>`;
    const text = `Store ${storeName} was not approved. Reason: ${reason}. Dashboard: ${dashboardUrl}`;
    return { subject, html: this.layout(subject, body, 'Store application update'), text };
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
