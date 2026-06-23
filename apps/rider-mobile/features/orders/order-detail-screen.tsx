import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { OrderStatusTimeline } from '@/features/orders/order-status-timeline';
import { AcceptRejectPanel } from '@/features/orders/accept-reject-panel';
import { NavigationCTA } from '@/features/orders/navigation-cta';
import { useOrderDetailQuery } from '@/hooks/use-delivery';
import { useDeliveryMutations, useAdvanceDelivery } from '@/hooks/use-delivery';
import { useDeliveryStore } from '@/store/delivery-store';
import { ACTION_LABELS, STATUS_LABELS, getNextStatus, statusToAction } from '@/lib/delivery-state-machine';
import { formatDistance, formatEta, haversineKm, estimateEtaMinutes } from '@/utils/distance';
import { useLocationStore } from '@/store/location-store';

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrderDetailQuery(id);
  const isLocked = useDeliveryStore((s) => s.isLocked);
  const setActiveOrder = useDeliveryStore((s) => s.setActiveOrder);
  const lat = useLocationStore((s) => s.currentLat);
  const lng = useLocationStore((s) => s.currentLng);

  const { accept, reject } = useDeliveryMutations(id ?? '');
  const { next, advanceToNext, isPending } = useAdvanceDelivery(order);

  useEffect(() => {
    if (order) setActiveOrder(order);
  }, [order, setActiveOrder]);

  if (isLoading) return <Loader fullScreen label="Loading order…" />;
  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Could not load order</Text>
      </View>
    );
  }

  const isAssigned = order.deliveryStatus === 'ASSIGNED';
  const nextAction = next ? statusToAction(next) : null;
  const nextLabel = nextAction ? ACTION_LABELS[nextAction] : null;

  const targetLat =
    order.deliveryStatus === 'PICKED_UP' || order.deliveryStatus === 'ARRIVED_AT_CUSTOMER'
      ? order.customerLat
      : order.storeLat;
  const targetLng =
    order.deliveryStatus === 'PICKED_UP' || order.deliveryStatus === 'ARRIVED_AT_CUSTOMER'
      ? order.customerLng
      : order.storeLng;

  const remainingKm =
    lat != null && lng != null ? haversineKm(lat, lng, targetLat, targetLng) : order.distanceKm;
  const etaMins =
    remainingKm != null ? estimateEtaMinutes(remainingKm) : order.estimatedMins;

  const handleReject = () => {
    Alert.alert('Decline order?', 'This returns the order to the pool.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => reject.mutate('Rider declined'),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>#{order.orderNumber}</Text>
        <Badge label={STATUS_LABELS[order.deliveryStatus]} tone="info" />
      </View>

      {remainingKm != null && (
        <Card>
          <Text style={styles.cardTitle}>Distance & ETA</Text>
          <Text style={styles.stat}>
            {formatDistance(remainingKm)} remaining · {formatEta(etaMins ?? 0)} ETA
          </Text>
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>Pickup</Text>
        <Text style={styles.line}>{order.storeName}</Text>
        <Text style={styles.muted}>{order.storeAddress}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Drop-off</Text>
        <Text style={styles.line}>{order.customerArea}</Text>
        {order.buyerNote ? <Text style={styles.muted}>Note: {order.buyerNote}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Items</Text>
        {order.items.map((item, i) => (
          <Text key={i} style={styles.line}>
            {item.quantity}× {item.name} ({item.variant})
          </Text>
        ))}
        <Text style={styles.earn}>Earning: ₹{order.riderEarning ?? '—'}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Progress</Text>
        <OrderStatusTimeline current={order.deliveryStatus} timeline={order.timeline} />
      </Card>

      {!isAssigned && (
        <NavigationCTA
          storeLat={order.storeLat}
          storeLng={order.storeLng}
          customerLat={order.customerLat}
          customerLng={order.customerLng}
          showStore={['ACCEPTED', 'ARRIVED_AT_STORE'].includes(order.deliveryStatus)}
          showCustomer={['PICKED_UP', 'ARRIVED_AT_CUSTOMER'].includes(order.deliveryStatus)}
        />
      )}

      {isAssigned && !isLocked && (
        <AcceptRejectPanel
          onAccept={() => accept.mutate()}
          onReject={handleReject}
          loading={accept.isPending || reject.isPending}
        />
      )}

      {isAssigned && isLocked && (
        <Text style={styles.hint}>Finish your active delivery before accepting another.</Text>
      )}

      {!isAssigned && nextLabel && getNextStatus(order.deliveryStatus) && (
        <Button
          label={nextLabel}
          onPress={advanceToNext}
          loading={isPending}
          disabled={!next}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#dc2626' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  line: { fontSize: 14, color: '#334155', marginBottom: 4 },
  muted: { fontSize: 13, color: '#64748b' },
  stat: { fontSize: 16, fontWeight: '600', color: '#0f766e' },
  earn: { marginTop: 8, fontWeight: '600', color: '#0f766e' },
  hint: { fontSize: 13, color: '#b45309', textAlign: 'center' },
});
