import { AuthGuard } from '@/features/auth/auth-guard';
import { WishlistScreen } from '@/features/wishlist/wishlist-screen';

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistScreen />
    </AuthGuard>
  );
}
