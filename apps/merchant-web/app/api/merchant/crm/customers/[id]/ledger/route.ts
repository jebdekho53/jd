import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  return proxyGet(`/merchant/crm/customers/${id}/ledger`, url.searchParams);
}
