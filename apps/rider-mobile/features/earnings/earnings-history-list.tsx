import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '@/components/ui/card';
import type { EarningsHistoryItem } from '@/services/rider-api';

interface Props {
  items: EarningsHistoryItem[];
}

export function EarningsHistoryList({ items }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Completed deliveries</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.orderId}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.order}>#{item.orderNumber}</Text>
              <Text style={styles.meta}>{item.paymentMethod}</Text>
            </View>
            <Text style={styles.amount}>+₹{item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No completed deliveries yet</Text>}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  order: { fontSize: 14, fontWeight: '600', color: '#334155' },
  meta: { fontSize: 12, color: '#94a3b8' },
  amount: { fontSize: 15, fontWeight: '700', color: '#0f766e' },
  empty: { fontSize: 14, color: '#94a3b8', paddingVertical: 12 },
});
