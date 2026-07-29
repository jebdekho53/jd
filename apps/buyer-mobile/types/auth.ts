export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  status: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface RequestOtpResult {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  isNewUser: boolean;
}

export function isBuyerUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  // Any signed-in phone user can shop as a buyer — there is no separate
  // buyer role gate the way merchant/rider/admin portals have one.
  return user.status !== 'SUSPENDED' && user.status !== 'DELETED';
}
