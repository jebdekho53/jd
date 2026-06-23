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

    if (!user.roles.includes('RIDER')) {
      return Response.json({ success: false, message: 'Rider role required' }, { status: 403 });
    }

    let kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    let riderStatus: 'OFFLINE' | 'ONLINE' | 'BUSY' | 'ON_DELIVERY' = 'OFFLINE';

    try {
      await fetchWithAuth('/rider/orders', undefined, req);
      kycStatus = 'APPROVED';
    } catch (err) {
      if (err instanceof BackendError && err.status === 403) {
        kycStatus = err.message.toLowerCase().includes('kyc') ? 'PENDING' : 'PENDING';
      }
    }

    return Response.json({
      success: true,
      data: {
        user,
        profile: {
          id: user.id,
          userId: user.id,
          displayName: user.phone,
          status: riderStatus,
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
