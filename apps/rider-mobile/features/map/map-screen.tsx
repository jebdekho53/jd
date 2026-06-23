import { View, Text, StyleSheet } from 'react-native';
import { LiveMap } from '@/features/map/live-map';
import { NavigationCTA } from '@/features/orders/navigation-cta';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useOrderDetailQuery } from '@/hooks/use-delivery';
import { isActiveDelivery } from '@/lib/delivery-state-machine';
import { Loader } from '@/components/ui/loader';

export function MapScreen() {
  const { data: orders, isLoading } = useOrdersQuery();
  const activeList = orders?.find((o) => isActiveDelivery(o.deliveryStatus));
  const { data: detail } = useOrderDetailQuery(activeList?.deliveryId);

  if (isLoading) return <Loader fullScreen label="Loading map…" />;

  return (
    <View style={styles.container}>
      <LiveMap order={detail ?? null} />
      {detail ? (
        <View style={styles.footer}>
          <Text style={styles.label}>#{detail.orderNumber} · {detail.storeName}</Text>
          <NavigationCTA
            storeLat={detail.storeLat}
            storeLng={detail.storeLng}
            customerLat={detail.customerLat}
            customerLng={detail.customerLng}
          />
        </View>
      ) : (
        <View style={styles.footer}>
          <Text style={styles.empty}>No active delivery on map</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  footer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  empty: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
