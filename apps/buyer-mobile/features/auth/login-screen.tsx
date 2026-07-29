import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';

type Step = 'phone' | 'otp';

export function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const formattedPhone = `+91${phone.replace(/^0/, '')}`;

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
      await verifyOtp.mutateAsync({ phone: formattedPhone, code: otp });
      router.replace('/home');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Image source={require('@/assets/icon.png')} style={styles.logo} accessibilityLabel="JebDekho" />
        <Text style={styles.title}>JebDekho</Text>
        <Text style={styles.subtitle}>Groceries, food and more, delivered fast</Text>
      </View>

      <Card style={styles.card}>
        {step === 'phone' ? (
          <>
            <Input
              label="Mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              placeholder="10-digit mobile"
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
            <Input
              label="6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              placeholder="••••••"
            />
            <Button
              label="Verify & Continue"
              onPress={handleVerify}
              loading={verifyOtp.isPending}
              disabled={otp.length !== 6}
            />
            <Pressable
              onPress={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
              style={styles.link}
            >
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
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { gap: 12 },
  error: { color: '#dc2626', fontSize: 13, marginTop: 4 },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: '#2E5E4E', fontSize: 14, fontWeight: '600' },
});
