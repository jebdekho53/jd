import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';
import { fetchRiderMe } from '@/services/rider-api';
import { isKycApproved, isRiderUser } from '@/types/rider';

type Step = 'phone' | 'otp';

export function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;

  const handleRequestOtp = async () => {
    setError(null);
    try {
      await requestOtp.mutateAsync(formattedPhone);
      setStep('otp');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleVerify = async () => {
    setError(null);
    try {
      const result = await verifyOtp.mutateAsync({ phone: formattedPhone, code: otp });
      if (!isRiderUser(result.user)) {
        setError('This account is not registered as a rider.');
        setStep('phone');
        return;
      }
      const profile = result.profile ?? (await fetchRiderMe()).profile;
      if (!isKycApproved(profile)) {
        setError('KYC not approved. Contact support to go online.');
        setStep('phone');
        return;
      }
      router.replace('/(app)/dashboard');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>JD</Text>
        </View>
        <Text style={styles.title}>Rider Login</Text>
        <Text style={styles.subtitle}>Real-time delivery execution</Text>
      </View>

      <Card style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Mobile number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              placeholder="10-digit mobile"
              placeholderTextColor="#94a3b8"
            />
            <Button
              label="Send OTP"
              onPress={handleRequestOtp}
              loading={requestOtp.isPending}
              disabled={phone.length !== 10}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>6-digit OTP</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              placeholder="••••••"
              placeholderTextColor="#94a3b8"
            />
            <Button
              label="Verify & Sign in"
              onPress={handleVerify}
              loading={verifyOtp.isPending}
              disabled={otp.length !== 6}
            />
            <Pressable onPress={() => { setStep('phone'); setOtp(''); }} style={styles.link}>
              <Text style={styles.linkText}>Change number</Text>
            </Pressable>
          </>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  error: { color: '#dc2626', fontSize: 13, marginTop: 8 },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: '#0f766e', fontSize: 14 },
});
