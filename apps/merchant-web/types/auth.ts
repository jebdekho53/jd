export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  status: string;
  phoneVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
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

export interface RequestOtpResult {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  user: AuthUser;
  isNewUser: boolean;
  expiresIn: number;
}
