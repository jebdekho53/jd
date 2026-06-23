export type RiderAvailability = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'ON_DELIVERY';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

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

export interface RiderProfile {
  id: string;
  userId: string;
  displayName: string;
  status: RiderAvailability;
  kycStatus: KycStatus;
  vehicleType: string | null;
  isVerified: boolean;
}

export interface RiderMeResponse {
  user: AuthUser;
  profile: RiderProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RequestOtpResult {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  user: AuthUser;
  profile: RiderProfile | null;
  isNewUser: boolean;
  expiresIn: number;
}

export const RIDER_ROLE = 'RIDER';

export function isRiderUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles.includes(RIDER_ROLE));
}

export function isKycApproved(profile: RiderProfile | null | undefined): boolean {
  return profile?.kycStatus === 'APPROVED';
}
