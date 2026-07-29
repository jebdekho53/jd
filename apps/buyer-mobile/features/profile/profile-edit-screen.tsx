import { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '@/hooks/use-profile';
import { useProfileStore } from '@/store/profile-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  textPrimary: '#111827',
  textMuted: '#6B7280',
};

export function ProfileEditScreen() {
  const router = useRouter();
  const profile = useProfile();
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const setEmail = useProfileStore((s) => s.setEmail);

  const [name, setName] = useState(profile?.displayName ?? '');
  const [email, setEmailValue] = useState(profile?.email ?? '');
  const [saved, setSaved] = useState(false);

  if (!profile) return <Loader fullScreen />;

  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSave = () => {
    setDisplayName(name.trim() || null);
    setEmail(email.trim() || null);
    setSaved(true);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Input label="Display name" value={name} onChangeText={setName} placeholder="Your name" />
        <Input
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmailValue(t);
            setSaved(false);
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailValid ? null : 'Enter a valid email address'}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.readonlyLabel}>Phone number</Text>
        <Text style={styles.readonlyValue}>{profile.phone}</Text>
        <Text style={styles.readonlyHint}>
          Your phone number is your sign-in identity and can&apos;t be changed here.
        </Text>
      </Card>

      <Text style={styles.notice}>
        Your name and email are stored on this device. The server does not yet persist buyer profile
        changes, so they won&apos;t follow you to another device.
      </Text>

      <Button label={saved ? 'Saved' : 'Save changes'} onPress={handleSave} disabled={!emailValid} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  card: { gap: 12 },
  readonlyLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  readonlyValue: { fontSize: 16, color: COLORS.textPrimary },
  readonlyHint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  notice: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
});
