import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartQuery } from '@/hooks/use-cart';
import {
  useAcceptLegalMutation,
  useCheckoutCodMutation,
  useCreateRazorpayOrderMutation,
  useInitiateCheckoutMutation,
  usePendingLegalQuery,
  useVerifyRazorpayPaymentMutation,
} from '@/hooks/use-checkout';
import { useAuthStore } from '@/store/auth-store';
import { CheckoutAddressPicker } from '@/features/addresses/checkout-address-picker';
import { RazorpayWebView } from '@/features/checkout/razorpay-webview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { StepUpPrompt } from '@/features/auth/step-up-prompt';
import { StepUpRequiredError, LegalAcceptanceRequiredError } from '@/services/buyer-api';
import { hasUsableCoordinates, toDeliveryAddress } from '@/lib/address';
import { uid } from '@/lib/uid';
import type { BuyerAddress } from '@/types/address';
import type { CheckoutPayload, RazorpayOrderResult } from '@/types/checkout';

type PaymentMethod = 'COD' | 'ONLINE';

export function CheckoutScreen() {
  const router = useRouter();
  const { data: cart } = useCartQuery();
  const { data: pendingLegal, refetch: refetchLegal } = usePendingLegalQuery(true);
  const acceptLegal = useAcceptLegalMutation();
  const checkoutCod = useCheckoutCodMutation();
  const initiateCheckout = useInitiateCheckoutMutation();
  const createRazorpayOrder = useCreateRazorpayOrderMutation();
  const verifyRazorpayPayment = useVerifyRazorpayPaymentMutation();
  const user = useAuthStore((s) => s.user);

  const [address, setAddress] = useState<BuyerAddress | null>(null);
  const [buyerNote, setBuyerNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showStepUp, setShowStepUp] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrderResult | null>(null);
  const [idempotencyKey] = useState(() => uid());
  const [razorpayOrderKey] = useState(() => uid());
  const [verifyKey] = useState(() => uid());

  if (!cart) {
    return <Loader fullScreen />;
  }

  const canPayOnline = !!user?.name && !!user?.email;
  const canPlace = hasUsableCoordinates(address);

  const buildPayload = (): CheckoutPayload => ({
    deliveryAddress: toDeliveryAddress(address!),
    buyerNote: buyerNote.trim() || undefined,
  });

  const placeCodOrder = async () => {
    const result = await checkoutCod.mutateAsync({ payload: buildPayload(), idempotencyKey });
    router.replace({ pathname: '/orders/[id]', params: { id: result.orderId } });
  };

  const startOnlinePayment = async () => {
    let activeCheckoutId = checkoutId;
    if (!activeCheckoutId) {
      const result = await initiateCheckout.mutateAsync({
        payload: { ...buildPayload(), payerContact: { name: user!.name!, email: user!.email!, phone: user!.phone } },
        idempotencyKey,
      });
      activeCheckoutId = result.checkoutId;
      setCheckoutId(activeCheckoutId);
    }
    const order = await createRazorpayOrder.mutateAsync({
      checkoutId: activeCheckoutId,
      idempotencyKey: razorpayOrderKey,
    });
    setRazorpayOrder(order);
  };

  const placeOrder = async () => {
    if (!canPlace) return;
    setError(null);
    try {
      if (paymentMethod === 'COD') {
        await placeCodOrder();
      } else {
        await startOnlinePayment();
      }
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

  const handlePaymentSuccess = async (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    if (!checkoutId) return;
    try {
      const result = await verifyRazorpayPayment.mutateAsync({
        payload: { checkoutId, ...payload },
        idempotencyKey: verifyKey,
      });
      setRazorpayOrder(null);
      router.replace({ pathname: '/orders/[id]', params: { id: result.orderId } });
    } catch (e) {
      setRazorpayOrder(null);
      setError(
        'Payment was captured but confirmation failed. Check My Orders — if it is missing, contact support with your payment reference.',
      );
    }
  };

  const handlePaymentDismiss = () => {
    setRazorpayOrder(null);
  };

  const handlePaymentFailure = (message: string) => {
    setRazorpayOrder(null);
    setError(message);
  };

  const hasPendingLegal = !!pendingLegal?.length;
  const isPlacing = checkoutCod.isPending || initiateCheckout.isPending || createRazorpayOrder.isPending;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CheckoutAddressPicker selected={address} onSelect={setAddress} />

        {address && !hasUsableCoordinates(address) && (
          <Text style={styles.warning}>
            This address has no map location. Edit it and re-pin so we can confirm delivery
            serviceability.
          </Text>
        )}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Note for the store (optional)</Text>
          <Input value={buyerNote} onChangeText={setBuyerNote} placeholder="e.g. Ring the bell twice" />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.paymentRow}>
            <Pressable
              style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Text style={[styles.paymentLabel, paymentMethod === 'COD' && styles.paymentLabelActive]}>
                Cash on Delivery
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.paymentOption,
                paymentMethod === 'ONLINE' && styles.paymentOptionActive,
                !canPayOnline && styles.paymentOptionDisabled,
              ]}
              onPress={() => canPayOnline && setPaymentMethod('ONLINE')}
              disabled={!canPayOnline}
            >
              <Text style={[styles.paymentLabel, paymentMethod === 'ONLINE' && styles.paymentLabelActive]}>
                Pay online
              </Text>
            </Pressable>
          </View>
          {!canPayOnline && (
            <Text style={styles.warning}>
              Add your name and email in Profile to pay online — UPI, cards, netbanking.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          <Row label="Items" value={`₹${cart.totals.subtotal.toFixed(2)}`} />
          <Row label="Delivery" value={cart.totals.deliveryFee === 0 ? 'Free' : `₹${cart.totals.deliveryFee.toFixed(2)}`} />
          <Row
            label={`To pay (${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online'})`}
            value={`₹${cart.totals.grandTotal.toFixed(2)}`}
            bold
          />
        </Card>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={
            paymentMethod === 'COD'
              ? `Place order · ₹${cart.totals.grandTotal.toFixed(0)} COD`
              : `Pay ₹${cart.totals.grandTotal.toFixed(0)} online`
          }
          onPress={placeOrder}
          loading={isPlacing}
          disabled={!canPlace}
        />
      </View>

      <RazorpayWebView
        order={razorpayOrder}
        onSuccess={handlePaymentSuccess}
        onDismiss={handlePaymentDismiss}
        onFailure={handlePaymentFailure}
      />

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
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  paymentOptionActive: { borderColor: '#2E5E4E', backgroundColor: '#ecf5f1' },
  paymentOptionDisabled: { opacity: 0.5 },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  paymentLabelActive: { color: '#2E5E4E' },
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
