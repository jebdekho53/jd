import { proxyGet } from '@/lib/auth/bff-proxy';

export interface DeliveryOtpResponse {
  deliveryOtp: string | null;
  verified: boolean;
  deliveryStatus: string;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet<DeliveryOtpResponse>(`/buyer/orders/${id}/delivery-otp`);
}
