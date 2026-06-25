export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  status: string;
  phoneVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  adminProfile?: {
    name: string;
    department: string | null;
    isSuperAdmin: boolean;
  } | null;
}

export interface AdminSettings {
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  credentialSource: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

export interface AdminSession {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  rememberMe: boolean;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface LoginStats {
  activeStores: number;
  totalOrders: number;
  activeRiders: number;
  merchants: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: PaginationMeta;
}

export interface RequestOtpResult {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  user: AuthUser;
  isNewUser: boolean;
  expiresIn: number;
}

export interface LoginResult {
  user: AuthUser;
  expiresIn: number;
}

export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
}
