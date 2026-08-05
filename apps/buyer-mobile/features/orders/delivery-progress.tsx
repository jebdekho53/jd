import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderChatModal } from '@/features/orders/order-chat-modal';
import type { OrderDelivery } from '@/types/orders';

const STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
] as const;

/** Maps the raw DeliveryStatus enum to a step index in the 4-stage tracker. */
function currentStepIndex(delivery: OrderDelivery): number {
  if (delivery.deliveredAt || delivery.status === 'DELIVERED') return 3;
  if (delivery.status === 'IN_TRANSIT' || delivery.status === 'ARRIVED_AT_CUSTOMER') return 2;
  if (delivery.pickedUpAt || delivery.status === 'PICKED_UP') return 1;
  return 0;
}

/** Distance-only positioning between store and customer (no rider fix yet). */
function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

export interface DeliveryProgressProps {
  orderId: string;
  delivery: OrderDelivery;
  store: { lat: number | null; lng: number | null } | null;
  customer: { lat: number | null; lng: number | null };
}

/** A dependency-free delivery tracker: status stepper + rider card + ETA/distance.
 *  There is no native map module in this app (avoids the native-linking risk of
 *  react-native-maps in a managed Expo Go workflow) — this is the visual
 *  substitute, same idea as most delivery apps' fallback when a live map isn't
 *  available. */
export function DeliveryProgress({ orderId, delivery, customer }: DeliveryProgressProps) {
  const active = currentStepIndex(delivery);
  const distanceLabel = formatDistance(delivery.distanceKm);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <View>
      <View style={styles.stepperRow}>
        {STEPS.map((step, idx) => (
          <View key={step.key} style={styles.stepWrap}>
            <View style={styles.stepLine}>
              {idx > 0 && (
                <View style={[styles.connector, idx <= active && styles.connectorActive]} />
              )}
            </View>
            <View style={[styles.dot, idx <= active && styles.dotActive]} />
            <Text style={[styles.stepLabel, idx <= active && styles.stepLabelActive]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        {delivery.etaAvailable && delivery.estimatedMins != null && (
          <Text style={styles.eta}>Arriving in ~{delivery.estimatedMins} min</Text>
        )}
        {distanceLabel && <Text style={styles.distance}>{distanceLabel}</Text>}
        {delivery.liveTrackingAvailable && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>

      {delivery.rider && (
        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
            <Text style={styles.riderInitial}>{delivery.rider.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.riderInfo}>
            <Text style={styles.riderName}>{delivery.rider.name}</Text>
            <Text style={styles.riderVehicle}>
              {delivery.rider.vehicleType ? delivery.rider.vehicleType.replace(/_/g, ' ') : 'Delivery partner'}
            </Text>
          </View>
          <View style={styles.riderActions}>
            {delivery.rider.phone && (
              <Pressable
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${delivery.rider!.phone}`)}
                accessibilityLabel={`Call ${delivery.rider.name}`}
              >
                <Ionicons name="call" size={16} color="#fff" />
              </Pressable>
            )}
            <Pressable
              style={styles.callButton}
              onPress={() => setChatOpen(true)}
              accessibilityLabel={`Chat with ${delivery.rider.name}`}
            >
              <Ionicons name="chatbubble" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {customer.lat == null && (
        <Text style={styles.hint}>Delivery location has no pin — distance shown is store-only.</Text>
      )}

      {delivery.rider && (
        <OrderChatModal
          visible={chatOpen}
          onClose={() => setChatOpen(false)}
          orderId={orderId}
          riderName={delivery.rider.name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: { flexDirection: 'row', marginTop: 4 },
  stepWrap: { flex: 1, alignItems: 'center' },
  stepLine: { position: 'absolute', top: 5, left: '-50%', width: '100%', height: 2 },
  connector: { flex: 1, height: 2, backgroundColor: '#e2e8f0' },
  connectorActive: { backgroundColor: '#2E5E4E' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e2e8f0', zIndex: 1 },
  dotActive: { backgroundColor: '#2E5E4E' },
  stepLabel: { fontSize: 10, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: '#2E5E4E', fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  eta: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  distance: { fontSize: 12, color: '#64748b' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  riderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E5E4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInitial: { color: '#fff', fontSize: 15, fontWeight: '700' },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  riderVehicle: { fontSize: 11, color: '#64748b', marginTop: 1, textTransform: 'capitalize' },
  riderActions: { flexDirection: 'row', gap: 8 },
  callButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E5E4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 10 },
});
