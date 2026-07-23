'use client';

import {
  normalizeLocationPayload,
  riderCodSubmitPayload,
  riderOrderActionPath,
  riderSupportTicketPath,
} from './rider-helpers';
import { triggerStepUp } from '@/store/ui-modals-store';

async function jfetch<T>(path: string, init?: RequestInit, _retried = false): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; message?: string };

  if (res.status === 403 && !_retried && String(json.message ?? '').includes('Re-authentication required')) {
    const success = await triggerStepUp();
    if (success) return jfetch<T>(path, init, true);
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return (json.data ?? (json as unknown as T)) as T;
}

export type RiderStatus = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'ON_DELIVERY';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'SCOOTER' | 'CAR' | 'WALK';

export interface RiderMe {
  user: { id: string; phone: string; email?: string | null; roles: string[] };
  isRider: boolean;
  profile: {
    id: string;
    userId: string;
    name: string;
    vehicleType: VehicleType;
    vehicleNumber: string | null;
    licenseNumber: string | null;
    kycStatus: KycStatus;
    status: RiderStatus;
    ratingAvg: number;
    ratingCount: number;
    totalDeliveries: number;
    currentLat: number | null;
    currentLng: number | null;
    lastLocationAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  restricted: boolean;
  restrictionReason: string | null;
}

export interface RegisterRiderInput {
  name: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  licenseNumber?: string;
  referralCode?: string;
}

export interface RiderOrder {
  deliveryId: string;
  orderId: string;
  orderNumber: string;
  deliveryStatus: string;
  storeName: string;
  storeLat: number;
  storeLng: number;
  customerLat: number;
  customerLng: number;
  customerArea: string;
  totalAmount: number;
  paymentMethod: string;
  assignedAt: string;
  riderEarning: number | null;
  // Rider-safe handover state (raw OTP is never sent to the rider).
  pickupOtpRequired?: boolean;
  pickupVerified?: boolean;
  deliveryOtpRequired?: boolean;
  deliveryVerified?: boolean;
  codDue?: boolean;
  codAmount?: string | null;
  /** Set only while this delivery has a live, unaccepted offer. */
  expiresAt?: string | null;
}

export interface RiderOrderDetail extends RiderOrder {
  storePhone: string | null;
  storeAddress: string;
  deliveryAddress: Record<string, string>;
  buyerNote: string | null;
  distanceKm: number | null;
  estimatedMins: number | null;
  items: { name: string; variant: string | null; quantity: number }[];
  timeline: { status: string; at: string }[];
}

export interface RiderEarnings {
  today: number;
  thisWeek: number;
  pendingPayout: number;
  totalPaid: number;
  recentDeliveries: Array<{
    orderNumber: string;
    earning: number;
    deliveredAt: string | null;
    paymentMethod: string;
  }>;
}

export interface RiderEarningsHistoryEntry {
  orderNumber: string;
  earning: number;
  deliveredAt: string | null;
  paymentMethod: string;
  totalAmount: number;
}

export interface RiderEarningsHistoryPage {
  items: RiderEarningsHistoryEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface PendingCod {
  totalToDeposit: number;
  count: number;
  items: Array<{ id: string; orderId: string; orderNumber: string | null; amount: number; collectedAt: string }>;
}

export interface SupportTicketList {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { code: string; name: string } | null;
  messages?: Array<{ id: string; body: string; createdAt: string; authorId: string }>;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
}

export type RiderDocumentType = 'ID_PROOF' | 'PAN_CARD' | 'DRIVING_LICENSE' | 'VEHICLE_RC' | 'PROFILE_PHOTO' | 'OTHER';

export interface RiderDocument {
  id: string;
  documentType: RiderDocumentType;
  fileUrl: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  updatedAt: string;
}

export interface RiderShift {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
  startedAt: string;
  endedAt?: string | null;
  deliveries: number;
  earnings: string | number;
}

export interface RiderIncentive {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  targetDeliveries: number;
  rewardAmount: number;
  startsAt: string;
  endsAt: string;
  progress: { deliveries: number; completed: boolean; remaining: number };
}

export interface RiderNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function toE164(input: string): string {
  const digits = (input ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

export const requestOtp = (phone: string) =>
  jfetch<{ message: string; expiresIn: number }>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: toE164(phone) }),
  });

export const verifyOtp = (phone: string, code: string) =>
  jfetch<{ user: { id: string; phone: string; roles: string[] } }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: toE164(phone), code }),
  });

export const logout = () => jfetch('/api/auth/logout', { method: 'POST' });
export const getMe = () => jfetch<RiderMe>('/api/rider/me');
export const registerRider = (input: RegisterRiderInput) =>
  jfetch<{ id: string; kycStatus: string }>('/api/rider/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export interface RiderPushStatus {
  configured: boolean;
  publicKey: string | null;
  subscribed: boolean;
  activeSubscriptions: number;
}

export const getPushStatus = () => jfetch<RiderPushStatus>('/api/rider/notifications/push/status');

export const subscribeToPush = (input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) =>
  jfetch<{ id: string; endpoint: string; isActive: boolean }>(
    '/api/rider/notifications/push/subscribe',
    { method: 'POST', body: JSON.stringify(input) },
  );

export const unsubscribeFromPush = (endpoint: string) =>
  jfetch<{ updated: number }>('/api/rider/notifications/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });

export interface FleetBatchItem {
  id: string;
  sequence: number;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    deliveryAddress: Record<string, string> | null;
    deliveryLat: number | null;
    deliveryLng: number | null;
    store: { name: string; latitude: number | null; longitude: number | null } | null;
  };
}

export interface FleetQueue {
  currentBatch: {
    id: string;
    status: string;
    totalOrders: number;
    createdAt: string;
    items: FleetBatchItem[];
  } | null;
  upcomingOrders: FleetBatchItem[];
}

export interface FleetRoute {
  id: string;
  distanceKm: number;
  estimatedMinutes: number;
  optimized: boolean;
  createdAt: string;
}

export const getFleetQueue = () => jfetch<FleetQueue | null>('/api/rider/fleet/queue');
export const getFleetRoute = () => jfetch<FleetRoute | null>('/api/rider/fleet/route');

export interface LegalAcceptance {
  code: string;
  version: string;
  acceptedAt: string;
  ipAddress: string | null;
}

export const listLegalAcceptances = () => jfetch<LegalAcceptance[]>('/api/legal/acceptances');

export const updateRiderProfile = (input: Partial<RegisterRiderInput>) =>
  jfetch<{ id: string; kycStatus: string; vehicleChanged: boolean }>('/api/rider/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const setStatus = (status: RiderStatus) =>
  jfetch<{ status: RiderStatus }>('/api/rider/status', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const listOrders = () => jfetch<RiderOrder[]>('/api/rider/orders');
export const getOrder = (orderId: string) => jfetch<RiderOrderDetail>(`/api/rider/orders/${orderId}`);
export const getEarnings = () => jfetch<RiderEarnings>('/api/rider/finance/earnings');

export const getEarningsHistory = (params: { page?: number; dateFrom?: string; dateTo?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  const qs = q.toString();
  return jfetch<RiderEarningsHistoryPage>(`/api/rider/finance/earnings/history${qs ? `?${qs}` : ''}`);
};
export const getPendingCod = () => jfetch<PendingCod>('/api/rider/finance/cod/pending');
export const submitCod = (orderIds: string[], amountDeposited: number, notes?: string) =>
  jfetch('/api/rider/finance/cod/submit', {
    method: 'POST',
    body: JSON.stringify(riderCodSubmitPayload(orderIds, amountDeposited, notes)),
  });

const action = (orderId: string, verb: string, body?: unknown) =>
  jfetch<RiderOrder>(riderOrderActionPath(orderId, verb), {
    method: 'PATCH',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

export const acceptOrder = (orderId: string) => action(orderId, 'accept');
export const rejectOrder = (orderId: string, reason: string) => action(orderId, 'reject', { reason });
export const arrivedStore = (orderId: string) => action(orderId, 'arrived-store');
export const pickedUp = (orderId: string) => action(orderId, 'picked-up');
export const arrivedCustomer = (orderId: string) => action(orderId, 'arrived-customer');
export const markDelivered = (orderId: string) => action(orderId, 'delivered');

// Handover verification (POST — carries the code the counterparty read out).
export const verifyPickupAction = (orderId: string, otp: string) =>
  jfetch<{ deliveryId: string; status: string }>(riderOrderActionPath(orderId, 'verify-pickup'), {
    method: 'POST',
    body: JSON.stringify({ otp }),
  });
export const verifyDeliveryAction = (orderId: string, otp: string, codCollected: boolean) =>
  jfetch<{ deliveryId: string; status: string }>(riderOrderActionPath(orderId, 'verify-delivery'), {
    method: 'POST',
    body: JSON.stringify({ otp, codCollected }),
  });
export const markFailed = (orderId: string, reason: string) => action(orderId, 'failed', { reason });

export const pushLocation = (input: { latitude: number; longitude: number; heading?: number; speed?: number; accuracy?: number }) =>
  jfetch('/api/rider/location', { method: 'PATCH', body: JSON.stringify(normalizeLocationPayload(input)) });

export interface RiderBankAccount {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName?: string | null;
  upiId?: string | null;
  verified: boolean;
}

export interface SaveBankAccountInput {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName?: string;
  upiId?: string;
  email?: string;
}

export const getBankAccount = () =>
  jfetch<RiderBankAccount | null>('/api/rider/finance/bank-account');

export const saveBankAccount = (input: SaveBankAccountInput) =>
  jfetch<RiderBankAccount>('/api/rider/finance/bank-account', {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const listSupportTickets = () => jfetch<SupportTicketList>('/api/rider/support/tickets');
export const getSupportTicket = (id: string) => jfetch<SupportTicket>(riderSupportTicketPath(id));
export const createSupportTicket = (input: {
  categoryCode: string;
  subject: string;
  description: string;
  priority?: string;
  orderId?: string;
}) =>
  jfetch<SupportTicket>(riderSupportTicketPath(), {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const replySupportTicket = (id: string, body: string) =>
  jfetch(riderSupportTicketPath(id, 'reply'), {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
export const listSupportArticles = (q?: string) =>
  jfetch<KnowledgeArticle[]>(`/api/rider/support/articles${q ? `?q=${encodeURIComponent(q)}` : ''}`);

export const uploadDocument = (dataUrl: string) =>
  jfetch<{ url: string }>('/api/uploads/document', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, purpose: 'rider-document' }),
  });

export const listRiderDocuments = () => jfetch<RiderDocument[]>('/api/rider/kyc/documents');
export const saveRiderDocument = (documentType: RiderDocumentType, fileUrl: string) =>
  jfetch<RiderDocument>('/api/rider/kyc/documents', {
    method: 'POST',
    body: JSON.stringify({ documentType, fileUrl }),
  });
export const submitRiderKyc = () => jfetch('/api/rider/kyc/submit', { method: 'POST' });

export const getCurrentShift = () => jfetch<RiderShift | null>('/api/rider/shifts/current');
export const startShift = (input: { latitude?: number; longitude?: number } = {}) =>
  jfetch<RiderShift>('/api/rider/shifts/start', { method: 'POST', body: JSON.stringify(input) });
export const endShift = (input: { latitude?: number; longitude?: number } = {}) =>
  jfetch<RiderShift>('/api/rider/shifts/end', { method: 'POST', body: JSON.stringify(input) });
export const listShiftHistory = () => jfetch<RiderShift[]>('/api/rider/shifts/history');

export const listIncentives = () => jfetch<RiderIncentive[]>('/api/rider/incentives');
export const listNotifications = () => jfetch<RiderNotification[]>('/api/rider/notifications');
export const markNotificationsRead = (notificationId?: string) =>
  jfetch<{ updated: number }>('/api/rider/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ notificationId }),
  });

export interface RiderNotificationPreferences {
  pushEnabled: boolean;
  offerAlerts: boolean;
  walletAlerts: boolean;
  complianceAlerts: boolean;
  supportAlerts: boolean;
}

export interface RiderReferralInfo {
  code: string;
  rewardPerReferral: number;
  totalEarned: number;
  referrals: Array<{
    status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FRAUD_FLAGGED';
    rewardAmount: number | null;
    completedAt: string | null;
    createdAt: string;
  }>;
}

export const getMyReferrals = () => jfetch<RiderReferralInfo>('/api/rider/referrals');

export const getNotificationPreferences = () =>
  jfetch<RiderNotificationPreferences>('/api/rider/notifications/preferences');
export const updateNotificationPreferences = (patch: Partial<RiderNotificationPreferences>) =>
  jfetch<RiderNotificationPreferences>('/api/rider/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

// ── Return pickups (reverse logistics) ────────────────────────────────────────
export type ReturnPickupStatus = 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED';

export interface ReturnPickup {
  id: string;
  status: ReturnPickupStatus;
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: Record<string, string> | null;
  dropLat?: number | null;
  dropLng?: number | null;
  riderEarning?: number | null;
  claim: { claimNumber: string; reason: string };
  store: { name: string; latitude: number | null; longitude: number | null; line1?: string | null };
}

export const getReturnPickups = () => jfetch<ReturnPickup[]>('/api/rider/return-pickups');

export const returnPickupAction = (id: string, action: 'accept' | 'picked-up' | 'completed' | 'decline') =>
  jfetch<ReturnPickup>(`/api/rider/return-pickups/${id}/${action}`, { method: 'POST' });
