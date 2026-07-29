import { Stack } from 'expo-router';
import { AuthGuard } from '@/features/auth/auth-guard';

export default function AppLayout() {
  return (
    <AuthGuard>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#2E5E4E' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="home" options={{ title: 'JebDekho' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="store/[slug]" options={{ title: 'Store' }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
        <Stack.Screen name="cart" options={{ title: 'Cart' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="orders/index" options={{ title: 'My Orders' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Order' }} />
        <Stack.Screen name="restaurants" options={{ title: 'Food' }} />
        <Stack.Screen name="restaurant/[slug]" options={{ title: 'Restaurant' }} />
        <Stack.Screen name="food-cart" options={{ title: 'Food Cart' }} />
        <Stack.Screen name="food-checkout" options={{ title: 'Food Checkout' }} />
        <Stack.Screen name="wishlist" options={{ title: 'Wishlist' }} />
        <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
        <Stack.Screen name="profile/addresses" options={{ title: 'Saved Addresses' }} />
        <Stack.Screen name="profile/rewards" options={{ title: 'Loyalty Rewards' }} />
        <Stack.Screen name="profile/referrals" options={{ title: 'Refer & Earn' }} />
      </Stack>
    </AuthGuard>
  );
}
