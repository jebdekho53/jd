import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RiderOrderListItem } from '@/types/order';
import { STATUS_LABELS } from '@/lib/delivery-state-machine';
import { formatDistance, haversineKm } from '@/utils/distance';
import { useLocationStore } from '@/store/location-store';

interface OrderCardProps {
  order: RiderOrderListItem;
  locked?: boolean;
}

function OrderCardInner({ order, locked }: OrderCardProps) {
  const router = useRouter();
  const lat = useLocationStore((s) => s.currentLat);
  const lng = useLocationStore((s) => s.currentLng);

  const dist =
    lat != null && lng != null
      ? haversineKm(lat, lng, order.storeLat, order.storeLng)
      : null;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/orders/${order.deliveryId}`)}
      disabled={locked && order.deliveryStatus === 'ASSIGNED'}
    >
      <Card style={locked && order.deliveryStatus === 'ASSIGNED' ? styles.dimmed : undefined}>
        <View style={styles.row}>
          <Text style={styles.number}>#{order.orderNumber}</Text>
          <Badge label={STATUS_LABELS[order.deliveryStatus]} tone="info" />
        </View>
        <Text style={styles.store}>{order.storeName}</Text>
        <Text style={styles.area}>{order.customerArea}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>₹{order.totalAmount}</Text>
          <Text style={styles.metaText}>{order.paymentMethod}</Text>
          {dist != null && <Text style={styles.metaText}>{formatDistance(dist)} to store</Text>}
          {order.riderEarning != null && (
            <Text style={styles.earn}>Earn ₹{order.riderEarning}</Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

export const OrderCard = memo(OrderCardInner, (prev, next) => {
  return (
    prev.locked === next.locked &&
    prev.order.deliveryId === next.order.deliveryId &&
    prev.order.deliveryStatus === next.order.deliveryStatus &&
    prev.order.totalAmount === next.order.totalAmount
  );
});

const styles = StyleSheet.create({
  dimmed: { opacity: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  number: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  store: { fontSize: 15, fontWeight: '600', color: '#334155' },
  area: { fontSize: 13, color: '#64748b', marginTop: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaText: { fontSize: 12, color: '#475569' },
  earn: { fontSize: 12, fontWeight: '600', color: '#0f766e' },
});
