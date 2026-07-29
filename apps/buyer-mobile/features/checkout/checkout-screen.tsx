import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartQuery } from '@/hooks/use-cart';
import { useAcceptLegalMutation, useCheckoutCodMutation, usePendingLegalQuery } from '@/hooks/use-checkout';
import { useLocationStore } from '@/store/location-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { StepUpPrompt } from '@/features/auth/step-up-prompt';
import { StepUpRequiredError, LegalAcceptanceRequiredError } from '@/services/buyer-api';
import { uid } from '@/lib/uid';
import type { CheckoutPayload } from '@/types/checkout';

export function CheckoutScreen() {
  const router = useRouter();
  const { data: cart } = useCartQuery();
  const { lat, lng } = useLocationStore();
  const { data: pendingLegal, refetch: refetchLegal } = usePendingLegalQuery(true);
  const acceptLegal = useAcceptLegalMutation();
  const checkoutCod = useCheckoutCodMutation();

  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showStepUp, setShowStepUp] = useState(false);
  const [idempotencyKey] = useState(() => uid());

  if (!cart) {
    return <Loader fullScreen />;
  }

  const addressComplete = line1.trim().length >= 4 && city.trim().length >= 2 && /^\d{6}$/.test(pincode) && lat != null && lng != null;

  const buildPayload = (): CheckoutPayload => ({
    deliveryAddress: {
      line1: line1.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      lat: lat!,
      lng: lng!,
    },
    buyerNote: buyerNote.trim() || undefined,
  });

  const placeOrder = async () => {
    setError(null);
    try {
      const result = await checkoutCod.mutateAsync({ payload: buildPayload(), idempotencyKey });
      router.replace({ pathname: '/orders/[id]', params: { id: result.orderId } });
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
    }
  };

  const handleStepUpVerified = async () => {
    setShowStepUp(false);
    await placeOrder();
  };

  const hasPendingLegal = !!pendingLegal?.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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
              Location not available — enable location access so we can confirm delivery serviceability.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Note for the store (optional)</Text>
          <Input value={buyerNote} onChangeText={setBuyerNote} placeholder="e.g. Ring the bell twice" />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          <Row label="Items" value={`₹${cart.totals.subtotal.toFixed(2)}`} />
          <Row label="Delivery" value={cart.totals.deliveryFee === 0 ? 'Free' : `₹${cart.totals.deliveryFee.toFixed(2)}`} />
          <Row label="To pay (Cash on Delivery)" value={`₹${cart.totals.grandTotal.toFixed(2)}`} bold />
        </Card>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={`Place order · ₹${cart.totals.grandTotal.toFixed(0)} COD`}
          onPress={placeOrder}
          loading={checkoutCod.isPending}
          disabled={!addressComplete}
        />
      </View>

      <StepUpPrompt visible={showStepUp} onVerified={handleStepUpVerified} onCancel={() => setShowStepUp(false)} />

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
  card: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  warning: { fontSize: 12, color: '#b45309' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: '#475569' },
  rowValue: { fontSize: 14, color: '#0f172a' },
  rowBold: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  error: { color: '#dc2626', fontSize: 13, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  legalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  legalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 16 },
  legalDoc: { gap: 8 },
  legalTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  legalSummary: { fontSize: 13, color: '#475569', lineHeight: 18 },
});
