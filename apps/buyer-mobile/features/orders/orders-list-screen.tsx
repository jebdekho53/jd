import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrdersListQuery } from '@/hooks/use-orders';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import type { OrderListItem } from '@/types/orders';

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'danger';
  if (status === 'OUT_FOR_DELIVERY' || status === 'RIDER_ASSIGNED' || status === 'PICKED_UP') return 'info';
  return 'warning';
}

export function OrdersListScreen() {
  const router = useRouter();
  const { data, isLoading } = useOrdersListQuery();

  if (isLoading) return <Loader fullScreen />;

  const orders = data?.orders ?? [];

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No orders yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }: { item: OrderListItem }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.id } })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Badge label={item.status.replace(/_/g, ' ')} tone={statusTone(item.status)} />
          </View>
          <Text style={styles.storeName}>{item.store?.name ?? 'Store'}</Text>
          <View style={styles.itemsRow}>
            {item.items.slice(0, 3).map((i, idx) =>
              i.imageUrl ? (
                <Image key={idx} source={{ uri: i.imageUrl }} style={styles.itemThumb} />
              ) : (
                <View key={idx} style={[styles.itemThumb, styles.itemThumbPlaceholder]} />
              ),
            )}
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.total}>₹{item.totalAmount.toFixed(2)}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  storeName: { fontSize: 13, color: '#64748b' },
  itemsRow: { flexDirection: 'row', gap: 6 },
  itemThumb: { width: 40, height: 40, borderRadius: 8 },
  itemThumbPlaceholder: { backgroundColor: '#e2e8f0' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  total: { fontSize: 14, fontWeight: '700', color: '#2E5E4E' },
  date: { fontSize: 12, color: '#94a3b8' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#64748b' },
});
