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
      </Stack>
    </AuthGuard>
  );
}
