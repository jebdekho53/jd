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
  message?: string;
}

export interface AuthBackendData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  isNewUser?: boolean;
  rememberMe?: boolean;
}

/** The role a user must hold to reach anything in this app. */
export const VENDOR_ROLE = 'VENDOR';

export function isVendor(user: Pick<AuthUser, 'roles'> | null | undefined): boolean {
  return Boolean(user?.roles?.includes(VENDOR_ROLE));
}
