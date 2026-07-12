import { adminFetch, buildQuery } from '@/services/api/admin-client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface WhatsAppConversation {
  id: string;
  waId: string;
  displayName: string | null;
  phoneNumber: string | null;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  waMessageId: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  text: string | null;
  status: string | null;
  timestamp: string;
}

export interface WhatsAppConversationsPage {
  items: WhatsAppConversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadConversations: number;
}

export interface WhatsAppMessagesPage {
  conversation: WhatsAppConversation;
  items: WhatsAppMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listWhatsAppConversations(
  params: { search?: string; unreadOnly?: boolean; page?: number; limit?: number } = {},
) {
  const res = await adminFetch<ApiResponse<WhatsAppConversationsPage>>(
    `/api/admin/whatsapp/conversations${buildQuery(params)}`,
  );
  return res.data;
}

export async function listWhatsAppMessages(
  conversationId: string,
  params: { page?: number; limit?: number } = {},
) {
  const res = await adminFetch<ApiResponse<WhatsAppMessagesPage>>(
    `/api/admin/whatsapp/conversations/${conversationId}/messages${buildQuery(params)}`,
  );
  return res.data;
}

export async function markWhatsAppConversationRead(conversationId: string) {
  const res = await adminFetch<ApiResponse<WhatsAppConversation>>(
    `/api/admin/whatsapp/conversations/${conversationId}/read`,
    { method: 'POST' },
  );
  return res.data;
}

export async function sendWhatsAppReply(conversationId: string, text: string) {
  const res = await adminFetch<ApiResponse<WhatsAppMessage>>(
    `/api/admin/whatsapp/conversations/${conversationId}/reply`,
    { method: 'POST', body: JSON.stringify({ text }) },
  );
  return res.data;
}

// ── Broadcasts ───────────────────────────────────────────────────────────────

export type WhatsAppBroadcastMode = 'TEXT' | 'TEMPLATE';

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  bodyText: string;
  variableCount: number;
}

export interface WhatsAppBroadcast {
  id: string;
  name: string;
  mode: WhatsAppBroadcastMode;
  templateName: string | null;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface WhatsAppBroadcastDetail extends WhatsAppBroadcast {
  failures: Array<{ waId: string; errorCode: number | null; errorMessage: string | null; attempts: number }>;
}

export interface CreateBroadcastInput {
  name: string;
  mode: WhatsAppBroadcastMode;
  csv: string;
  bodyTemplate?: string;
  templateName?: string;
  templateLang?: string;
  templateParams?: string[];
}

export async function listWhatsAppTemplates() {
  const res = await adminFetch<ApiResponse<WhatsAppTemplate[]>>('/api/admin/whatsapp/broadcasts/templates');
  return res.data;
}

export async function listWhatsAppBroadcasts(params: { page?: number; limit?: number } = {}) {
  const res = await adminFetch<
    ApiResponse<{ items: WhatsAppBroadcast[]; total: number; page: number; limit: number; totalPages: number }>
  >(`/api/admin/whatsapp/broadcasts${buildQuery(params)}`);
  return res.data;
}

export async function getWhatsAppBroadcast(id: string) {
  const res = await adminFetch<ApiResponse<WhatsAppBroadcastDetail>>(`/api/admin/whatsapp/broadcasts/${id}`);
  return res.data;
}

export async function createWhatsAppBroadcast(input: CreateBroadcastInput) {
  const res = await adminFetch<
    ApiResponse<{
      broadcast: WhatsAppBroadcast;
      skippedRows: Array<{ row: number; raw: string; reason: string }>;
    }>
  >('/api/admin/whatsapp/broadcasts', { method: 'POST', body: JSON.stringify(input) });
  return res.data;
}
