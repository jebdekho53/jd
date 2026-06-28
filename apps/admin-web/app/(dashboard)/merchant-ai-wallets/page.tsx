import { MerchantAiWalletsContent } from '@/features/merchant-ai-wallets/merchant-ai-wallets-content';

export default function MerchantAiWalletsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Merchant AI Wallets</h1>
        <p className="text-sm text-slate-500">
          Prepaid AI wallet balances, recharges, debits, and manual adjustments.
        </p>
      </div>
      <MerchantAiWalletsContent />
    </div>
  );
}
