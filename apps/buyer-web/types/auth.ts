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

export interface RequestOtpResult {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  user: AuthUser;
  isNewUser: boolean;
  expiresIn: number;
}

export interface BuyerProfileLocal {
  displayName: string | null;
  onboardingCompleted: boolean;
}
