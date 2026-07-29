import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useLocationStore } from '@/store/location-store';
import { useEnsureLocation } from '@/hooks/use-location';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
};

/**
 * buyer-web's settings page also carries dark-mode and language toggles, but
 * both are unwired preferences stored in localStorage. This app has a single
 * light theme and one locale, so only the controls that actually do something
 * are offered here.
 */
export function SettingsScreen() {
  const router = useRouter();
  useEnsureLocation();
  const { lat, lng, label, pincode, permissionDenied } = useLocationStore();

  const appVersion = Constants.expoConfig?.version ?? '—';
  const hasLocation = lat != null && lng != null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery location</Text>
        {hasLocation ? (
          <>
            <Text style={styles.value}>{label ?? 'Current location'}</Text>
            <Text style={styles.hint}>
              {lat.toFixed(4)}, {lng.toFixed(4)}
              {pincode ? ` · PIN ${pincode}` : ''}
            </Text>
          </>
        ) : (
          <Text style={styles.hint}>Location not set.</Text>
        )}
        {permissionDenied && (
          <>
            <Text style={styles.warning}>
              Location access is denied, so results fall back to Delhi. Grant access in system
              settings to see stores that actually deliver to you.
            </Text>
            <Button
              label="Open system settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.hint}>Choose which alerts reach you and on which channels.</Text>
        <Pressable style={styles.linkRow} onPress={() => router.push('/profile/notifications')}>
          <Text style={styles.linkText}>Notification preferences</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Legal</Text>
        {(
          [
            { label: 'Terms of service', href: '/legal/terms' },
            { label: 'Privacy policy', href: '/legal/privacy' },
            { label: 'Refund policy', href: '/legal/refund-policy' },
          ] as const
        ).map((item) => (
          <Pressable key={item.href} style={styles.linkRow} onPress={() => router.push(item.href)}>
            <Text style={styles.linkText}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>About this app</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Version</Text>
          <Text style={styles.metaValue}>{appVersion}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  card: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  value: { fontSize: 14, color: COLORS.textPrimary },
  hint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  warning: { fontSize: 12, color: '#b45309', lineHeight: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  linkText: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  chevron: { fontSize: 20, color: '#cbd5e1' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 13, color: COLORS.textMuted },
  metaValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
});
