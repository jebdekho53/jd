import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocationStore } from '@/store/location-store';
import type { RiderOrderDetail } from '@/types/order';

interface Props {
  order: RiderOrderDetail | null;
}

function LiveMapInner({ order }: Props) {
  const lat = useLocationStore((s) => s.currentLat);
  const lng = useLocationStore((s) => s.currentLng);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Map preview unavailable on web</Text>
      <Text style={styles.hint}>Use the iOS or Android app for live map tracking.</Text>
      {lat != null && lng != null && (
        <Text style={styles.coord}>Your location: {lat.toFixed(5)}, {lng.toFixed(5)}</Text>
      )}
      {order && (
        <>
          <Text style={styles.coord}>
            Store: {order.storeLat.toFixed(5)}, {order.storeLng.toFixed(5)}
          </Text>
          <Text style={styles.coord}>
            Customer: {order.customerLat.toFixed(5)}, {order.customerLng.toFixed(5)}
          </Text>
        </>
      )}
    </View>
  );
}

export const LiveMap = memo(LiveMapInner, (prev, next) => {
  if (!prev.order && !next.order) return true;
  if (!prev.order || !next.order) return false;
  return prev.order.deliveryId === next.order.deliveryId;
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#e2e8f0',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a', textAlign: 'center' },
  hint: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  coord: { fontSize: 13, color: '#334155', fontFamily: 'monospace' },
});
