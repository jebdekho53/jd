import { NextRequest } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET(req: NextRequest) {
  try {
    const user = await fetchWithAuth<{
      id: string;
      phone: string;
      roles: string[];
      [key: string]: unknown;
    }>('/auth/me', undefined, req);

    // Authenticated but not yet a rider → frontend shows the signup/onboarding form.
    if (!user.roles.includes('RIDER')) {
      return Response.json({
        success: true,
        data: { user, profile: null, isRider: false },
      });
    }

    // Rider: KYC is APPROVED if the rider order endpoint is reachable, else PENDING.
    let kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    try {
      await fetchWithAuth('/rider/orders', undefined, req);
      kycStatus = 'APPROVED';
    } catch (err) {
      if (!(err instanceof BackendError && err.status === 403)) throw err;
    }

    return Response.json({
      success: true,
      data: {
        user,
        isRider: true,
        profile: {
          id: user.id,
          userId: user.id,
          displayName: user.phone,
          status: 'OFFLINE',
          kycStatus,
          vehicleType: null,
          isVerified: kycStatus === 'APPROVED',
        },
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
