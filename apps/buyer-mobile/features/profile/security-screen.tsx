import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile, useLogoutAllDevicesMutation } from '@/hooks/use-profile';
import { useLogoutMutation } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  success: '#16a34a',
};

const SAFETY_TIPS = [
  'JebDekho will never ask for your OTP — not by call, SMS or WhatsApp.',
  'Delivery partners never need your OTP before handing over the order in full.',
  'Report anything suspicious from Help & support so we can investigate.',
];

export function SecurityScreen() {
  const router = useRouter();
  const profile = useProfile();
  const logoutAll = useLogoutAllDevicesMutation();
  const logout = useLogoutMutation();

  if (!profile) return <Loader fullScreen />;

  /** logout-all revokes every refresh token including this device's, so the
   *  session has to be torn down locally too. */
  const confirmLogoutAll = () => {
    Alert.alert(
      'Sign out everywhere?',
      'This revokes every signed-in session, including this device. You will need a new OTP to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out all',
          style: 'destructive',
          onPress: () =>
            logoutAll.mutate(undefined, {
              onSuccess: () =>
                logout.mutate(undefined, { onSettled: () => router.replace('/login') }),
              onError: (e) => Alert.alert('Could not sign out', (e as Error).message),
            }),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Sign-in method</Text>
        <View style={styles.methodRow}>
          <Text style={styles.methodEmoji}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodLabel}>Phone OTP</Text>
            <Text style={styles.methodValue}>{profile.phone}</Text>
          </View>
          {profile.phoneVerified && <Text style={styles.verified}>Verified</Text>}
        </View>
        <Text style={styles.hint}>
          There is no password on your account — every sign-in uses a one-time code sent to this
          number. Sensitive actions like checkout ask you to re-verify.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Sessions</Text>
        <Text style={styles.hint}>
          Signing out everywhere revokes every device that is currently signed in, including this
          one.
        </Text>
        <Button
          label="Sign out of all devices"
          variant="danger"
          loading={logoutAll.isPending || logout.isPending}
          onPress={confirmLogoutAll}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Staying safe</Text>
        {SAFETY_TIPS.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  card: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodEmoji: { fontSize: 20 },
  methodLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  methodValue: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  verified: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  hint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipBullet: { fontSize: 13, color: COLORS.primary },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
});
