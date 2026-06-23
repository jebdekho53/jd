import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/card';

interface Props {
  weeklyTotal: number;
  deliveryCount: number;
}

export function WeeklyChart({ weeklyTotal, deliveryCount }: Props) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  const bars = days.map((d, i) => {
    const height = i === today ? Math.max(24, Math.min(120, weeklyTotal / 10)) : 16 + (i % 3) * 12;
    return { d, height, active: i === today };
  });

  return (
    <Card>
      <Text style={styles.title}>This week</Text>
      <Text style={styles.total}>₹{weeklyTotal.toFixed(0)} · {deliveryCount} trips</Text>
      <View style={styles.chart}>
        {bars.map((b, i) => (
          <View key={i} style={styles.col}>
            <View style={[styles.bar, { height: b.height }, b.active && styles.barActive]} />
            <Text style={styles.day}>{b.d}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  total: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
  col: { alignItems: 'center', flex: 1 },
  bar: { width: 20, backgroundColor: '#cbd5e1', borderRadius: 6 },
  barActive: { backgroundColor: '#0f766e' },
  day: { fontSize: 11, color: '#64748b', marginTop: 6 },
});
