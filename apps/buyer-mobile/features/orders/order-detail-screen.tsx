import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOrderDetailQuery, useCancelOrderMutation } from '@/hooks/use-orders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { BUYER_CANCELLABLE } from '@/types/orders';

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrderDetailQuery(orderId);
  const cancelOrder = useCancelOrderMutation();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Loader fullScreen />;
  if (!order) return <Text style={styles.empty}>Order not found</Text>;

  const canCancel = BUYER_CANCELLABLE.has(order.status);

  const handleCancel = async () => {
    setError(null);
    try {
      await cancelOrder.mutateAsync({ orderId: order.id, reason: 'Changed my mind' });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Badge label={order.status.replace(/_/g, ' ')} tone="info" />
        </View>
        <Text style={styles.storeName}>{order.store?.name}</Text>
        <Text style={styles.meta}>{new Date(order.createdAt).toLocaleString()}</Text>
      </Card>

      {order.delivery && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <Text style={styles.rowValue}>{order.delivery.status ?? 'Awaiting assignment'}</Text>
          {order.delivery.riderName && (
            <Text style={styles.rowValue}>Rider: {order.delivery.riderName}</Text>
          )}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.productName}
              {item.variantName ? ` (${item.variantName})` : ''}
            </Text>
            <Text style={styles.itemQty}>× {item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.totalPrice.toFixed(2)}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Bill</Text>
        <Row label="Subtotal" value={order.subtotal} />
        {order.discountAmount > 0 && <Row label="Discount" value={-order.discountAmount} />}
        {order.taxAmount > 0 && <Row label="Taxes" value={order.taxAmount} />}
        <Row label="Delivery" value={order.deliveryFee} />
        <View style={styles.divider} />
        <Row label="Total" value={order.totalAmount} bold />
        <Text style={styles.paymentMethod}>{order.paymentMethod} · {order.paymentStatus}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Status history</Text>
        {order.statusHistory.map((h, idx) => (
          <View key={idx} style={styles.historyRow}>
            <Text style={styles.historyStatus}>{h.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</Text>
          </View>
        ))}
      </Card>

      {error && <Text style={styles.error}>{error}</Text>}
      {canCancel && (
        <Button label="Cancel order" variant="danger" onPress={handleCancel} loading={cancelOrder.isPending} />
      )}
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>₹{Math.abs(value).toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  card: { gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  storeName: { fontSize: 14, color: '#334155' },
  meta: { fontSize: 12, color: '#94a3b8' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 13, color: '#0f172a' },
  itemQty: { fontSize: 13, color: '#64748b' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: '#475569' },
  rowValue: { fontSize: 13, color: '#0f172a' },
  rowBold: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  paymentMethod: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyStatus: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  historyDate: { fontSize: 12, color: '#94a3b8' },
  error: { color: '#dc2626', fontSize: 13, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
