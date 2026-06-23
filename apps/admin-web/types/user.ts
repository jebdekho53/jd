export type UserRole = 'BUYER' | 'MERCHANT' | 'RIDER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AdminUserListItem {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  roles: UserRole[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface SuspendUserPayload {
  reason: string;
}
