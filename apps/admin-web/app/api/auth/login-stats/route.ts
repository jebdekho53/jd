import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import type { ApiResponse } from '@/types/admin';

export async function GET() {
  try {
    const { data } = await backendFetch<ApiResponse<{
      activeStores: number;
      totalOrders: number;
      activeRiders: number;
      merchants: number;
    }>>('/admin-auth/login-stats');
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json({
      success: true,
      data: { activeStores: 0, totalOrders: 0, activeRiders: 0, merchants: 0 },
    });
  }
}
