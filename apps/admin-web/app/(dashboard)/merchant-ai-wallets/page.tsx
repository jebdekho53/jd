import { MerchantAiWalletsContent } from '@/features/merchant-ai-wallets/merchant-ai-wallets-content';
import { BackButton } from '@/components/navigation/back-button';

export default function MerchantAiWalletsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Merchant AI Wallets</h1>
          <p className="text-sm text-slate-500">
            Prepaid AI wallet balances, recharges, debits, and manual adjustments.
          </p>
        </div>
        <BackButton fallbackHref="/dashboard" />
      </div>
      <MerchantAiWalletsContent />
    </div>
  );
}
