'use client';

import { adminFetch, buildQuery } from '@/services/api/admin-client';

type ApiResponse<T> = { success: boolean; data: T };

export type AdminRiderDocumentStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type AdminRiderIncentiveStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface AdminRiderDocument {
  id: string;
  riderProfileId: string;
  documentType: string;
  fileUrl: string;
  status: AdminRiderDocumentStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  updatedAt: string;
  riderProfile: {
    id: string;
    name: string;
    vehicleType: string;
    vehicleNumber?: string | null;
    licenseNumber?: string | null;
    kycStatus: string;
    status: string;
    user: { id: string; phone: string; email?: string | null };
  };
}

export interface AdminRiderIncentive {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  targetDeliveries: number;
  rewardAmount: number;
  startsAt: string;
  endsAt: string;
  status: AdminRiderIncentiveStatus;
  participants: number;
  completed: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRiderIncentiveInput {
  code?: string;
  title: string;
  description?: string;
  targetDeliveries: number;
  rewardAmount: number;
  startsAt: string;
  endsAt: string;
  status?: AdminRiderIncentiveStatus;
}

export const listAdminRiderDocuments = (status?: string) =>
  adminFetch<ApiResponse<AdminRiderDocument[]>>(
    `/api/admin/riders/kyc/documents${buildQuery({ status })}`,
  ).then((res) => res.data);

export const approveAdminRiderDocument = (documentId: string) =>
  adminFetch<ApiResponse<unknown>>(`/api/admin/riders/kyc/documents/${documentId}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

export const rejectAdminRiderDocument = (documentId: string, reason: string) =>
  adminFetch<ApiResponse<unknown>>(`/api/admin/riders/kyc/documents/${documentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

export const listAdminRiderIncentives = (status?: string) =>
  adminFetch<ApiResponse<AdminRiderIncentive[]>>(
    `/api/admin/riders/incentives${buildQuery({ status })}`,
  ).then((res) => res.data);

export const createAdminRiderIncentive = (input: SaveRiderIncentiveInput & { code: string }) =>
  adminFetch<ApiResponse<AdminRiderIncentive>>('/api/admin/riders/incentives', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateAdminRiderIncentive = (id: string, input: Partial<SaveRiderIncentiveInput>) =>
  adminFetch<ApiResponse<AdminRiderIncentive>>(`/api/admin/riders/incentives/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
