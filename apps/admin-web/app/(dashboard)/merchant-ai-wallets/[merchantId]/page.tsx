import Link from 'next/link';
import { MerchantAiWalletDetailContent } from '@/features/merchant-ai-wallets/merchant-ai-wallets-content';

export default async function MerchantAiWalletDetailPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = await params;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/merchant-ai-wallets" className="text-sm text-indigo-600 hover:underline">
          ← Back to wallets
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Merchant AI Wallet</h1>
        <p className="text-sm text-slate-500">{merchantId}</p>
      </div>
      <MerchantAiWalletDetailContent merchantId={merchantId} />
    </div>
  );
}
