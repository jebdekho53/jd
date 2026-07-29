import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useFoodCartQuery, useFoodCheckoutCodMutation } from '@/hooks/use-food';
import { useAcceptLegalMutation, usePendingLegalQuery } from '@/hooks/use-checkout';
import { useLocationStore } from '@/store/location-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { StepUpPrompt } from '@/features/auth/step-up-prompt';
import { LegalAcceptanceRequiredError, StepUpRequiredError } from '@/services/buyer-api';
import { uid } from '@/lib/uid';
import type { InitiateFoodCheckoutPayload } from '@/types/food';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  success: '#16a34a',
  danger: '#dc2626',
};

export function FoodCheckoutScreen() {
  const router = useRouter();
  const { data: cart, isLoading } = useFoodCartQuery();
  const { lat, lng } = useLocationStore();
  const { data: pendingLegal, refetch: refetchLegal } = usePendingLegalQuery(true);
  const acceptLegal = useAcceptLegalMutation();
  const placeCodOrder = useFoodCheckoutCodMutation();

  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [restaurantNote, setRestaurantNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showStepUp, setShowStepUp] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [idempotencyKey] = useState(() => uid());
  const placingRef = useRef(false);

  // The cart is emptied server-side on success, so only bounce back when it
  // was already empty on arrival.
  useEffect(() => {
    if (!isLoading && !orderPlaced && (!cart || cart.items.length === 0)) {
      router.replace('/food-cart');
    }
  }, [isLoading, cart, orderPlaced, router]);

  if (orderPlaced) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Order placed!</Text>
        <Text style={styles.successText}>
          Order <Text style={styles.successNumber}>{orderPlaced.orderNumber}</Text> is confirmed. Pay
          cash on delivery when your order arrives.
        </Text>
        <View style={styles.successActions}>
          <Button
            label="Track order"
            onPress={() => router.replace({ pathname: '/orders/[id]', params: { id: orderPlaced.orderId } })}
          />
          <Button
            label="Order more food"
            variant="secondary"
            onPress={() => router.replace('/restaurants')}
          />
        </View>
      </View>
    );
  }

  if (isLoading || !cart) return <Loader fullScreen />;

  // 'SELF' stores deliver with their own staff — there is no rider to collect
  // cash, so the API only offers online payment. This app is COD-only today.
  const selfDelivery = cart.store.deliveryMode === 'SELF';
  const addressComplete =
    line1.trim().length >= 4 &&
    city.trim().length >= 2 &&
    /^\d{6}$/.test(pincode) &&
    lat != null &&
    lng != null;

  const buildPayload = (): InitiateFoodCheckoutPayload => ({
    deliveryAddress: {
      line1: line1.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      lat: lat!,
      lng: lng!,
    },
    deliveryLat: lat!,
    deliveryLng: lng!,
    paymentMethod: 'COD',
    restaurantNote: restaurantNote.trim() || undefined,
  });

  const placeOrder = async () => {
    // A ref guards the double-tap race: `isPending` doesn't flip synchronously,
    // so two taps in the same tick could both clear the disabled check.
    if (placingRef.current) return;
    placingRef.current = true;
    setError(null);
    try {
      const result = await placeCodOrder.mutateAsync({ payload: buildPayload(), idempotencyKey });
      setOrderPlaced({ orderId: result.orderId, orderNumber: result.orderNumber });
    } catch (e) {
      if (e instanceof StepUpRequiredError) {
        setShowStepUp(true);
        return;
      }
      if (e instanceof LegalAcceptanceRequiredError) {
        await refetchLegal();
        return;
      }
      setError((e as Error).message);
    } finally {
      placingRef.current = false;
    }
  };

  const hasPendingLegal = !!pendingLegal?.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.title}>🍽️ Food checkout</Text>
          <Text style={styles.subtitle}>
            {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} from {cart.store.name}
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <Input label="House / flat / street" value={line1} onChangeText={setLine1} placeholder="42 MG Road" />
          <Input label="City" value={city} onChangeText={setCity} placeholder="New Delhi" />
          <Input
            label="Pincode"
            value={pincode}
            onChangeText={(t) => setPincode(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="110001"
          />
          {lat == null && (
            <Text style={styles.warning}>
              Location not available — enable location access so we can confirm delivery
              serviceability.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Note for the restaurant (optional)</Text>
          <Input
            value={restaurantNote}
            onChangeText={setRestaurantNote}
            placeholder="e.g. Less spicy, no onions"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <View style={styles.radioOn}>
              <Text style={styles.radioMark}>●</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>Cash on delivery</Text>
              <Text style={styles.paymentHint}>Pay the delivery partner when your food arrives.</Text>
            </View>
          </View>
          {selfDelivery && (
            <Text style={styles.warning}>
              This restaurant delivers with its own staff and only accepts online payment. Order from
              the website to pay online.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          <Row label="Subtotal" value={`₹${cart.totals.subtotal.toFixed(2)}`} />
          <Row
            label="Fees & tax"
            value={`₹${(cart.totals.packagingFee + cart.totals.deliveryFee + cart.totals.tax).toFixed(2)}`}
          />
          <View style={styles.divider} />
          <Row label="To pay (Cash on Delivery)" value={`₹${cart.totals.grandTotal.toFixed(2)}`} bold />
        </Card>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={`Place order · ₹${cart.totals.grandTotal.toFixed(0)} COD`}
          onPress={placeOrder}
          loading={placeCodOrder.isPending}
          disabled={!addressComplete || selfDelivery}
        />
      </View>

      <StepUpPrompt
        visible={showStepUp}
        onVerified={async () => {
          setShowStepUp(false);
          await placeOrder();
        }}
        onCancel={() => setShowStepUp(false)}
      />

      <Modal visible={hasPendingLegal} transparent animationType="fade">
        <View style={styles.legalBackdrop}>
          <View style={styles.legalCard}>
            <Text style={styles.sectionTitle}>Before you continue</Text>
            {pendingLegal?.map((doc) => (
              <View key={doc.code} style={styles.legalDoc}>
                <Text style={styles.legalTitle}>{doc.title}</Text>
                <Text style={styles.legalSummary}>{doc.summary}</Text>
                <Button
                  label="I agree"
                  onPress={() => acceptLegal.mutate({ code: doc.code, version: doc.version })}
                  loading={acceptLegal.isPending}
                />
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  card: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  warning: { fontSize: 12, color: '#b45309' },

  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOn: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioMark: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  paymentLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  paymentHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: COLORS.textSecondary },
  rowValue: { fontSize: 14, color: COLORS.textPrimary },
  rowBold: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },
  error: { color: COLORS.danger, fontSize: 13, textAlign: 'center' },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },

  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: { fontSize: 30, fontWeight: '800', color: COLORS.success },
  successTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  successText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  successNumber: { fontWeight: '800', color: COLORS.textPrimary },
  successActions: { alignSelf: 'stretch', gap: 10, marginTop: 8 },

  legalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  legalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 16 },
  legalDoc: { gap: 8 },
  legalTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  legalSummary: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
