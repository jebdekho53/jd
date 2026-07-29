import { AuthGuard } from '@/features/auth/auth-guard';
import { AddressesScreen } from '@/features/addresses/addresses-screen';

export default function AddressesPage() {
  return (
    <AuthGuard>
      <AddressesScreen />
    </AuthGuard>
  );
}
