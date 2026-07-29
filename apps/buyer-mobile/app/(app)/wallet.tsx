import { AuthGuard } from '@/features/auth/auth-guard';
import { WalletScreen } from '@/features/wallet/wallet-screen';

export default function WalletPage() {
  return (
    <AuthGuard>
      <WalletScreen />
    </AuthGuard>
  );
}
