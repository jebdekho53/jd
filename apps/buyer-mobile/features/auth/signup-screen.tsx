import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSignupMutation } from '@/hooks/use-auth';

export function SignupScreen() {
  const router = useRouter();
  const signup = useSignupMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Use at least 8 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await signup.mutateAsync({ name: name.trim(), email: email.trim().toLowerCase(), password });
      router.replace('/home');
    } catch (e) {
      setErrors({ form: (e as Error).message });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Sign up with your email and password</Text>
        </View>

        <Card style={styles.card}>
          <Input label="Full name" value={name} onChangeText={setName} error={errors.name} placeholder="Your name" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            placeholder="At least 8 characters"
            secureTextEntry
          />
          {errors.form && <Text style={styles.error}>{errors.form}</Text>}
          <Button label="Create account" onPress={submit} loading={signup.isPending} />
        </Card>

        <Pressable style={styles.link} onPress={() => router.push('/email-login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  link: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#2E5E4E', fontSize: 14, fontWeight: '600' },
});
