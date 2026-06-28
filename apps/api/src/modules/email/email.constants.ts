export const EMAIL_COLORS = {
  primary: '#16A34A',
  secondary: '#0F172A',
  muted: '#64748B',
  background: '#F8FAFC',
  white: '#FFFFFF',
} as const;

export const EMAIL_LOGO_URL = 'https://jebdekho.com/logo.png';

export const EMAIL_TEMPLATE = {
  OTP: 'otp',
  WELCOME: 'welcome',
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_DELIVERED: 'order_delivered',
  PASSWORD_RESET: 'password_reset',
  SUPPORT_TICKET: 'support_ticket',
  REFUND: 'refund',
  GST_INVOICE: 'gst_invoice',
  TEST: 'test',
  ADMIN_WELCOME: 'admin_welcome',
  ADMIN_PASSWORD_RESET: 'admin_password_reset',
  ADMIN_SECURITY_ALERT: 'admin_security_alert',
  ADMIN_NEW_DEVICE: 'admin_new_device',
  MERCHANT_APPROVED: 'merchant_approved',
  MERCHANT_REJECTED: 'merchant_rejected',
} as const;

export type EmailTemplateCode = (typeof EMAIL_TEMPLATE)[keyof typeof EMAIL_TEMPLATE];
