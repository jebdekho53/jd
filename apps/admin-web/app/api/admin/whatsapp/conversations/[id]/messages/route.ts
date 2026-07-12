import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet(
    `/admin/whatsapp/conversations/${encodeURIComponent(id)}/messages`,
    new URL(req.url).searchParams,
  );
}
