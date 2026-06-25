import { proxyDelete } from '@/lib/auth/bff-proxy';

export async function DELETE() {
  return proxyDelete('/buyer/cart/coupon');
}
