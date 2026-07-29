import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/hooks/use-auth';

type Step = 'request' | 'reset';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const forgot = useForgotPasswordMutation();
  const reset = useResetPasswordMutation();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitRequest = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    try {
      const result = await forgot.mutateAsync(email.trim().toLowerCase());
      setInfo(result.message ?? 'Check your email for reset instructions');
      setStep('reset');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submitReset = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('Use at least 8 characters');
      return;
    }
    try {
      await reset.mutateAsync({ code: code.trim(), newPassword });
      router.replace('/email-login');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'request' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter your email and we will send you a code to reset it.
              </Text>
            </View>
            <Card style={styles.card}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Button label="Send reset code" onPress={submitRequest} loading={forgot.isPending} />
            </Card>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Set a new password</Text>
              <Text style={styles.subtitle}>{info ?? 'Enter the code from your email, then choose a new password.'}</Text>
            </View>
            <Card style={styles.card}>
              <Input
                label="Reset code"
                value={code}
                onChangeText={setCode}
                placeholder="Code from email"
                autoCapitalize="none"
              />
              <Input
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                secureTextEntry
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Button label="Update password" onPress={submitReset} loading={reset.isPending} />
              <Pressable onPress={() => setStep('request')}>
                <Text style={styles.linkText}>Use a different email</Text>
              </Pressable>
            </Card>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, gap: 12, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 12, gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  card: { gap: 12 },
  error: { color: '#dc2626', fontSize: 13 },
  linkText: { color: '#2E5E4E', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
