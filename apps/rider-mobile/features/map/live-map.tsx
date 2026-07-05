import { memo, useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteLine } from '@/features/map/route-line';
import { useLocationStore } from '@/store/location-store';
import type { RiderOrderDetail } from '@/types/order';

interface Props {
  order: RiderOrderDetail | null;
}

function LiveMapInner({ order }: Props) {
  const lat = useLocationStore((s) => s.currentLat);
  const lng = useLocationStore((s) => s.currentLng);

  if (lat == null || lng == null) {
    return (
      <View style={[styles.wrap, styles.center]}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.text}>Waiting for GPS location...</Text>
      </View>
    );
  }

  const region = useMemo(() => {
    const points = [
      { latitude: lat, longitude: lng },
      order ? { latitude: order.storeLat, longitude: order.storeLng } : null,
      order ? { latitude: order.customerLat, longitude: order.customerLng } : null,
    ].filter(Boolean) as { latitude: number; longitude: number }[];

    if (points.length === 0) {
      return { latitude: 0, longitude: 0, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    }

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
    };
  }, [lat, lng, order?.deliveryId, order?.storeLat, order?.customerLat]);

  const route = useMemo(
    () =>
      order
        ? [
            { latitude: order.storeLat, longitude: order.storeLng },
            { latitude: order.customerLat, longitude: order.customerLng },
          ]
        : [],
    [order?.storeLat, order?.storeLng, order?.customerLat, order?.customerLng],
  );

  return (
    <View style={styles.wrap}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={region} region={region}>
        {lat != null && lng != null && (
          <Marker coordinate={{ latitude: lat, longitude: lng }} title="You" pinColor="#0f766e" />
        )}
        {order && (
          <>
            <Marker
              coordinate={{ latitude: order.storeLat, longitude: order.storeLng }}
              title="Store"
              pinColor="#2563eb"
            />
            <Marker
              coordinate={{ latitude: order.customerLat, longitude: order.customerLng }}
              title="Customer"
              pinColor="#dc2626"
            />
            <RouteLine coordinates={route} />
          </>
        )}
      </MapView>
    </View>
  );
}

export const LiveMap = memo(LiveMapInner, (prev, next) => {
  if (!prev.order && !next.order) return true;
  if (!prev.order || !next.order) return false;
  return prev.order.deliveryId === next.order.deliveryId;
});

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});
