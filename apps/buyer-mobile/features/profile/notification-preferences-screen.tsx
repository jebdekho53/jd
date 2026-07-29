import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferenceMutation,
} from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import type { NotificationPreferenceKey } from '@/types/profile';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
};

const GROUPS: {
  title: string;
  rows: { key: NotificationPreferenceKey; label: string; hint: string }[];
}[] = [
  {
    title: 'Channels',
    rows: [
      { key: 'pushEnabled', label: 'Push', hint: 'Alerts on this device' },
      { key: 'emailEnabled', label: 'Email', hint: 'Receipts and updates by email' },
      { key: 'smsEnabled', label: 'SMS', hint: 'Text message alerts' },
      { key: 'whatsappEnabled', label: 'WhatsApp', hint: 'Updates on WhatsApp' },
    ],
  },
  {
    title: 'Alert types',
    rows: [
      { key: 'orderUpdates', label: 'Order updates', hint: 'Accepted, packed, out for delivery' },
      { key: 'walletAlerts', label: 'Wallet alerts', hint: 'Credits, debits and expiring balance' },
      { key: 'offerAlerts', label: 'Offers', hint: 'Discounts and promotions' },
      { key: 'referralAlerts', label: 'Referrals', hint: 'When an invite pays out' },
      { key: 'supportAlerts', label: 'Support', hint: 'Replies on your tickets' },
      { key: 'complianceAlerts', label: 'Account & compliance', hint: 'Policy and account notices' },
    ],
  },
  {
    title: 'Consent',
    rows: [
      {
        key: 'marketingConsent',
        label: 'Marketing messages',
        hint: 'Turning this off suppresses offers and referral messages on every channel',
      },
    ],
  },
];

export function NotificationPreferencesScreen() {
  const { data: prefs, isLoading, isError, refetch } = useNotificationPreferencesQuery();
  const updatePref = useUpdateNotificationPreferenceMutation();

  if (isLoading) return <Loader fullScreen />;

  if (isError || !prefs) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load preferences</Text>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Choose how and when we reach you.</Text>

      {GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title.toUpperCase()}</Text>
          <View style={styles.card}>
            {group.rows.map((row, index) => (
              <View key={row.key} style={[styles.row, index > 0 && styles.rowDivided]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowHint}>{row.hint}</Text>
                </View>
                <Switch
                  value={prefs[row.key]}
                  disabled={updatePref.isPending}
                  onValueChange={(value) => updatePref.mutate({ key: row.key, value })}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      {updatePref.isError && (
        <Text style={styles.error}>{(updatePref.error as Error).message}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 16 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  group: { gap: 8 },
  groupTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowDivided: { borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  rowHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 15 },
  error: { fontSize: 13, color: '#dc2626' },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  stateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
});
