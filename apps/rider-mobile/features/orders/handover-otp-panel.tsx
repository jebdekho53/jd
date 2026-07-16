import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type HandoverKind = 'pickup' | 'delivery';

interface Props {
  kind: HandoverKind;
  /** Only meaningful for delivery: server says cash must be collected. */
  codDue?: boolean;
  /** Server-authoritative collectible amount (string). Never entered by rider. */
  codAmount?: string | null;
  loading?: boolean;
  /** Human-readable error from the last failed attempt (incorrect/exhausted/etc). */
  errorMessage?: string | null;
  onSubmit: (otp: string, codCollected: boolean) => void;
}

const COPY = {
  pickup: {
    title: 'Verify pickup',
    hint: 'Ask the store for the pickup code and enter it to confirm handover.',
    cta: 'Confirm pickup',
  },
  delivery: {
    title: 'Verify delivery',
    hint: 'Ask the customer for their delivery code and enter it to complete.',
    cta: 'Complete delivery',
  },
} as const;

export function HandoverOtpPanel({
  kind,
  codDue = false,
  codAmount = null,
  loading = false,
  errorMessage = null,
  onSubmit,
}: Props) {
  const [otp, setOtp] = useState('');
  const [cashAcknowledged, setCashAcknowledged] = useState(false);
  const copy = COPY[kind];

  const otpValid = otp.length >= 4 && otp.length <= 6;
  const codBlocking = kind === 'delivery' && codDue && !cashAcknowledged;
  const canSubmit = otpValid && !codBlocking && !loading;

  const handleOtpChange = (text: string) => {
    // Numeric only; never store or log the raw code beyond local state.
    setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(otp, cashAcknowledged);
  };

  const codLabel = useMemo(
    () => (codAmount ? `Collect ₹${codAmount} cash` : 'Collect cash'),
    [codAmount],
  );

  return (
    <Card>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.hint}>{copy.hint}</Text>

      {kind === 'delivery' && codDue ? (
        <View
          style={styles.codBanner}
          accessible
          accessibilityLabel={`Cash on delivery. ${codLabel}.`}
        >
          <Text style={styles.codTitle}>{'⚠'} {codLabel}</Text>
          <Pressable
            style={styles.checkRow}
            onPress={() => setCashAcknowledged((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: cashAcknowledged }}
            accessibilityLabel="I have collected the cash"
            hitSlop={8}
          >
            <View style={[styles.checkbox, cashAcknowledged && styles.checkboxOn]}>
              {cashAcknowledged ? <Text style={styles.checkMark}>{'✓'}</Text> : null}
            </View>
            <Text style={styles.checkLabel}>I have collected the cash</Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={handleOtpChange}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        placeholder="Enter code"
        placeholderTextColor="#94a3b8"
        autoFocus
        editable={!loading}
        accessibilityLabel={`${copy.title} code input`}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {errorMessage ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}

      {codBlocking ? (
        <Text style={styles.blocking}>Acknowledge cash collection to continue.</Text>
      ) : null}

      <Button
        label={copy.cta}
        onPress={handleSubmit}
        loading={loading}
        disabled={!canSubmit}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#0f172a',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 10, fontWeight: '600' },
  blocking: { color: '#b45309', fontSize: 13, marginBottom: 10 },
  codBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  codTitle: { fontSize: 16, fontWeight: '700', color: '#b45309' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#b45309' },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 16 },
  checkLabel: { fontSize: 15, color: '#0f172a', fontWeight: '600', flexShrink: 1 },
});

// Announce COD requirement for screen readers when the panel mounts in a COD flow.
export function announceCod(codAmount: string | null) {
  if (codAmount) {
    AccessibilityInfo.announceForAccessibility(`Cash on delivery. Collect ${codAmount} rupees.`);
  }
}
