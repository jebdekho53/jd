import { View, Text, StyleSheet } from 'react-native';
import type { DeliveryStatus } from '@/types/order';
import { STATUS_LABELS } from '@/lib/delivery-state-machine';

const FLOW: DeliveryStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'ARRIVED_AT_STORE',
  'PICKED_UP',
  'ARRIVED_AT_CUSTOMER',
  'DELIVERED',
];

interface Props {
  current: DeliveryStatus;
  timeline?: { status: DeliveryStatus; at: string }[];
}

export function OrderStatusTimeline({ current, timeline = [] }: Props) {
  const currentIdx = FLOW.indexOf(current);

  return (
    <View style={styles.wrap}>
      {FLOW.map((status, idx) => {
        const done = idx <= currentIdx;
        const event = timeline.find((t) => t.status === status);
        return (
          <View key={status} style={styles.row}>
            <View style={[styles.dot, done && styles.dotDone]} />
            <View style={styles.content}>
              <Text style={[styles.label, done && styles.labelDone]}>{STATUS_LABELS[status]}</Text>
              {event && <Text style={styles.time}>{new Date(event.at).toLocaleTimeString()}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    marginTop: 4,
  },
  dotDone: { backgroundColor: '#0f766e' },
  content: { flex: 1 },
  label: { fontSize: 14, color: '#94a3b8' },
  labelDone: { color: '#0f172a', fontWeight: '600' },
  time: { fontSize: 11, color: '#64748b', marginTop: 2 },
});
