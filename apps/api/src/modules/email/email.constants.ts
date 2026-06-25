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
} as const;

export type EmailTemplateCode = (typeof EMAIL_TEMPLATE)[keyof typeof EMAIL_TEMPLATE];
