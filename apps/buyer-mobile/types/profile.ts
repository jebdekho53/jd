/** Mirrors the NotificationPreference model in prisma/schema.prisma, which
 *  GET/PATCH /buyer/crm/preferences reads and writes verbatim. */
export interface NotificationPreferences {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  marketingConsent: boolean;
  orderUpdates: boolean;
  walletAlerts: boolean;
  offerAlerts: boolean;
  referralAlerts: boolean;
  supportAlerts: boolean;
  complianceAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationPreferenceKey =
  | 'pushEnabled'
  | 'emailEnabled'
  | 'smsEnabled'
  | 'whatsappEnabled'
  | 'marketingConsent'
  | 'orderUpdates'
  | 'walletAlerts'
  | 'offerAlerts'
  | 'referralAlerts'
  | 'supportAlerts'
  | 'complianceAlerts';

export interface InboxNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface InboxPage {
  items: InboxNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

export interface SupportCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface SupportArticle {
  id: string;
  slug: string;
  title: string;
  body: string;
  categoryId: string | null;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; code: string; name: string } | null;
}

export interface SupportMessage {
  id: string;
  body: string;
  authorType: string;
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export interface SupportTicketsPage {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketPayload {
  categoryCode: string;
  subject: string;
  description: string;
  orderId?: string;
}
