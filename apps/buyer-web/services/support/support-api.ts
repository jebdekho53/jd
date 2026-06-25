import { buyerFetch } from '@/services/api/buyer-auth-client';

export interface SupportCategory {
  code?: string;
  name?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  category?: { code: string; name: string };
  messages?: Array<{ id: string; body: string; createdAt: string }>;
  feedback?: { rating: number; comment?: string } | null;
}

export async function fetchSupportCategories() {
  const res = await buyerFetch<{ success: boolean; data: string[] }>('/api/buyer/support/categories');
  return res.data;
}

export async function fetchSupportTickets() {
  const res = await buyerFetch<{ success: boolean; data: { items: SupportTicket[] } }>(
    '/api/buyer/support/tickets',
  );
  return res.data.items;
}

export async function fetchSupportTicket(id: string) {
  const res = await buyerFetch<{ success: boolean; data: SupportTicket }>(
    `/api/buyer/support/tickets/${id}`,
  );
  return res.data;
}

export async function createSupportTicket(input: {
  categoryCode: string;
  subject: string;
  description: string;
  orderId?: string;
}) {
  const res = await buyerFetch<{ success: boolean; data: SupportTicket }>('/api/buyer/support/tickets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function replySupportTicket(id: string, body: string) {
  const res = await buyerFetch<{ success: boolean; data: unknown }>(
    `/api/buyer/support/tickets/${id}/reply`,
    { method: 'POST', body: JSON.stringify({ body }) },
  );
  return res.data;
}

export async function submitTicketFeedback(id: string, rating: number, comment?: string) {
  const res = await buyerFetch<{ success: boolean; data: unknown }>(
    `/api/buyer/support/tickets/${id}/feedback`,
    { method: 'POST', body: JSON.stringify({ rating, comment }) },
  );
  return res.data;
}

export async function fetchHelpArticles(q?: string) {
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await buyerFetch<{ success: boolean; data: Array<{ title: string; body: string; category: string }> }>(
    `/api/buyer/support/articles${params}`,
  );
  return res.data;
}
