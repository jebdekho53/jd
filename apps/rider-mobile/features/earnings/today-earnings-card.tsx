import { Card } from '@/components/ui/card';
import { Text, StyleSheet } from 'react-native';

interface Props {
  amount: number;
  deliveries: number;
}

export function TodayEarningsCard({ amount, deliveries }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Today's earnings</Text>
      <Text style={styles.amount}>₹{amount.toFixed(0)}</Text>
      <Text style={styles.sub}>{deliveries} deliveries completed</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0f766e' },
  label: { color: '#ccfbf1', fontSize: 14 },
  amount: { color: '#fff', fontSize: 36, fontWeight: '700', marginVertical: 4 },
  sub: { color: '#99f6e4', fontSize: 13 },
});
