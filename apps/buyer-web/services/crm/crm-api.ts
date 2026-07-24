import { buyerFetch } from '@/services/api/buyer-auth-client';

export interface CrmPreferences {
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
}

export async function fetchCrmPreferences(): Promise<CrmPreferences> {
  const res = await buyerFetch<{ success: boolean; data: CrmPreferences }>('/api/buyer/crm/preferences');
  return res.data;
}

export async function updateCrmPreferences(patch: Partial<CrmPreferences>): Promise<CrmPreferences> {
  const res = await buyerFetch<{ success: boolean; data: CrmPreferences }>('/api/buyer/crm/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function trackMarketingEvent(
  eventType: string,
  opts?: { productId?: string; storeId?: string; orderId?: string; metadata?: Record<string, unknown> },
) {
  try {
    await buyerFetch('/api/buyer/crm/events', {
      method: 'POST',
      body: JSON.stringify({ eventType, ...opts }),
    });
  } catch {
    // Best-effort personalization signal — never break the buyer's action over this.
  }
}

export interface RecommendationEntry {
  entityType: string;
  entityId: string;
  score: number;
  reason: string;
}

export async function fetchRecommendations(
  type: 'product' | 'store' = 'product',
): Promise<RecommendationEntry[]> {
  const res = await buyerFetch<{ success: boolean; data: RecommendationEntry[] }>(
    `/api/buyer/crm/recommendations?type=${type}`,
  );
  return res.data ?? [];
}

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

export async function fetchNotificationInbox(page = 1): Promise<InboxPage> {
  const res = await buyerFetch<{ success: boolean; data: InboxPage }>(
    `/api/buyer/crm/inbox?page=${page}`,
  );
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await buyerFetch(`/api/buyer/crm/inbox/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await buyerFetch('/api/buyer/crm/inbox/read-all', { method: 'PATCH' });
}
