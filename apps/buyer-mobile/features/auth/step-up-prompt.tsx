import { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useRequestOtpMutation, useStepUpMutation } from '@/hooks/use-auth';

interface Props {
  visible: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

/**
 * Sensitive actions (checkout) require the session's login to be less than
 * 15 minutes old. If it's stale, the API rejects with a step-up error and
 * this modal re-verifies the same phone via a fresh OTP without a full
 * logout, then lets the caller retry the original action once.
 */
export function StepUpPrompt({ visible, onVerified, onCancel }: Props) {
  const { user } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestOtp = useRequestOtpMutation();
  const stepUp = useStepUpMutation();

  const phone = user?.phone ?? '';

  const handleSend = async () => {
    setError(null);
    try {
      await requestOtp.mutateAsync(phone);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleVerify = async () => {
    setError(null);
    try {
      await stepUp.mutateAsync({ phone, code: otp });
      setOtp('');
      setSent(false);
      onVerified();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify it&apos;s you</Text>
          <Text style={styles.subtitle}>
            For your security, please confirm the OTP sent to {phone} before we place this order.
          </Text>

          {!sent ? (
            <Button label="Send OTP" onPress={handleSend} loading={requestOtp.isPending} />
          ) : (
            <>
              <Input
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
              />
              <Button
                label="Verify"
                onPress={handleVerify}
                loading={stepUp.isPending}
                disabled={otp.length !== 6}
              />
            </>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  error: { color: '#dc2626', fontSize: 13 },
});
