import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/**
 * Mark a route as public — JwtAuthGuard will skip JWT verification.
 * Use on auth endpoints (OTP, refresh) and health checks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
