import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, proxyDelete } from '@/lib/auth/bff-proxy';

export async function GET() {
  return proxyGet('/buyer/wishlist');
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/buyer/wishlist');
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = await ctx.params;
  const productId = segments?.[0] ?? '';
  return proxyDelete(`/buyer/wishlist/${encodeURIComponent(productId)}`);
}
