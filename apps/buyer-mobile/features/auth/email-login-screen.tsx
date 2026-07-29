import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEmailLoginMutation } from '@/hooks/use-auth';

export function EmailLoginScreen() {
  const router = useRouter();
  const login = useEmailLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await login.mutateAsync({ email: email.trim().toLowerCase(), password });
      router.replace('/home');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use your email and password</Text>
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
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Sign in"
            onPress={submit}
            loading={login.isPending}
            disabled={!email.trim() || !password}
          />
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </Card>

        <Pressable style={styles.link} onPress={() => router.push('/signup')}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.replace('/login')}>
          <Text style={styles.linkText}>Sign in with phone OTP instead</Text>
        </Pressable>
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
  forgotText: { color: '#2E5E4E', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  link: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#2E5E4E', fontSize: 14, fontWeight: '600' },
});
