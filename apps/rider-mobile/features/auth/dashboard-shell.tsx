import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRiderStore } from '@/store/rider-store';
import { useAuthStore } from '@/store/auth-store';
import { useLogoutMutation } from '@/hooks/use-auth';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useRiderStatusMutation } from '@/hooks/use-rider-status';
import { OrderCard } from '@/features/orders/order-card';
import { isActiveDelivery } from '@/lib/delivery-state-machine';
import { Loader } from '@/components/ui/loader';

export function DashboardShell() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { availability, isToggling } = useRiderStore();
  const { mutate: logout } = useLogoutMutation();
  const { mutate: setStatus } = useRiderStatusMutation();
  const { data: orders, isLoading } = useOrdersQuery();

  const isOnline =
    availability === 'ONLINE' || availability === 'ON_DELIVERY' || availability === 'BUSY';
  const active = orders?.find((o) => isActiveDelivery(o.deliveryStatus));
  const assigned = orders?.filter((o) => o.deliveryStatus === 'ASSIGNED') ?? [];
  const isLocked = Boolean(active);

  const toggleOnline = () => {
    if (availability === 'ON_DELIVERY') return;
    setStatus(isOnline ? 'OFFLINE' : 'ONLINE');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.displayName ?? 'Rider'}</Text>
          <Badge label={availability.replace('_', ' ')} tone={isOnline ? 'success' : 'neutral'} />
        </View>
        <Pressable onPress={() => logout()}>
          <Text style={styles.logout}>Sign out</Text>
        </Pressable>
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.cardTitle}>Availability</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            disabled={isToggling || availability === 'ON_DELIVERY'}
            trackColor={{ true: '#0f766e', false: '#cbd5e1' }}
          />
        </View>
        {availability === 'ON_DELIVERY' && (
          <Text style={styles.hint}>Complete active delivery before going offline.</Text>
        )}
      </Card>

      {isLoading ? (
        <Loader label="Syncing orders…" />
      ) : (
        <>
          <Text style={styles.section}>Active delivery</Text>
          {active ? (
            <OrderCard order={active} />
          ) : (
            <Card>
              <Text style={styles.placeholder}>No active delivery</Text>
            </Card>
          )}

          <Text style={styles.section}>Pending assignments</Text>
          {assigned.length === 0 ? (
            <Card>
              <Text style={styles.placeholder}>Queue empty</Text>
            </Card>
          ) : (
            assigned.map((o) => <OrderCard key={o.deliveryId} order={o} locked={isLocked} />)
          )}
        </>
      )}

      <View style={styles.navRow}>
        {[
          { label: 'Orders', href: '/(app)/orders' },
          { label: 'Map', href: '/(app)/map' },
          { label: 'Earnings', href: '/(app)/earnings' },
          { label: 'Profile', href: '/(app)/profile' },
        ].map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as never)}
            style={styles.navItem}
          >
            <Text style={styles.navText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  logout: { color: '#64748b', fontSize: 14 },
  statusCard: { marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  section: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 15, color: '#334155' },
  hint: { marginTop: 8, fontSize: 12, color: '#b45309' },
  placeholder: { fontSize: 14, color: '#94a3b8' },
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
  },
  navText: { fontSize: 13, fontWeight: '600', color: '#334155' },
});
