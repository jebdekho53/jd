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
  metadata?: Record<string, unknown>,
) {
  await buyerFetch('/api/buyer/crm/events', {
    method: 'POST',
    body: JSON.stringify({ eventType, metadata }),
  });
}
