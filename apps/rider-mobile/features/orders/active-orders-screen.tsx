import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useDeliveryStore } from '@/store/delivery-store';
import { OrderCard } from '@/features/orders/order-card';
import { Loader } from '@/components/ui/loader';
import { isActiveDelivery } from '@/lib/delivery-state-machine';
import type { RiderOrderListItem } from '@/types/order';

export function ActiveOrdersScreen() {
  const { data, isLoading, refetch, isRefetching } = useOrdersQuery();
  const isLocked = useDeliveryStore((s) => s.isLocked);

  const active = data?.find((o) => isActiveDelivery(o.deliveryStatus));
  const assigned = data?.filter((o) => o.deliveryStatus === 'ASSIGNED') ?? [];

  if (isLoading) return <Loader fullScreen label="Loading orders…" />;

  const renderItem = ({ item }: { item: RiderOrderListItem }) => (
    <OrderCard order={item} locked={isLocked} />
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={assigned}
      keyExtractor={(item) => item.deliveryId}
      renderItem={renderItem}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.section}>Active delivery</Text>
          {active ? (
            <OrderCard order={active} />
          ) : (
            <Text style={styles.empty}>No active delivery</Text>
          )}
          <Text style={styles.section}>Pending assignments</Text>
          {assigned.length === 0 && (
            <Text style={styles.empty}>Queue empty — stay online for new orders</Text>
          )}
        </View>
      }
      ListFooterComponent={<View style={{ height: 24 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  header: { gap: 12, marginBottom: 4 },
  section: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  empty: { fontSize: 14, color: '#94a3b8', paddingVertical: 8 },
});
