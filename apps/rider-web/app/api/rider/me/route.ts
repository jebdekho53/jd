import { NextRequest } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const user = await fetchWithAuth<{
      id: string;
      phone: string;
      email?: string | null;
      roles: string[];
      [key: string]: unknown;
    }>('/auth/me', undefined, req);

    if (!user.roles.includes('RIDER')) {
      return Response.json({
        success: true,
        data: { user, profile: null, isRider: false },
      });
    }

    const data = await fetchWithAuth('/rider/me', { method: 'GET' }, req);
    return Response.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
