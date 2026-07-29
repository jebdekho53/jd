import { Stack } from 'expo-router';
import { AuthGuard } from '@/features/auth/auth-guard';
import { RealtimeProvider } from '@/components/providers/realtime-provider';

export default function AppLayout() {
  return (
    <AuthGuard>
      <RealtimeProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0f766e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Stack.Screen name="orders/index" options={{ title: 'Orders' }} />
          <Stack.Screen name="orders/[id]" options={{ title: 'Order' }} />
          <Stack.Screen name="map" options={{ title: 'Live Map' }} />
          <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        </Stack>
      </RealtimeProvider>
    </AuthGuard>
  );
}
