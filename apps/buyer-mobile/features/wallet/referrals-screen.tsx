import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, RefreshControl } from 'react-native';
import { useApplyReferralMutation, useReferralsQuery } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  success: '#16a34a',
};

export function ReferralsScreen() {
  const { data: referral, isLoading, isError, refetch, isRefetching } = useReferralsQuery();
  const applyReferral = useApplyReferralMutation();
  const [code, setCode] = useState('');

  if (isLoading) return <Loader fullScreen />;

  if (isError || !referral) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load referrals</Text>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  const shareText = `Use my JebDekho code ${referral.code} for ₹100 off your first order!`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.subtitle}>Invite friends and earn rewards</Text>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>🎁</Text>
        </View>
        <Text style={styles.heroLabel}>Your referral code</Text>
        <Text style={styles.heroCode}>{referral.code}</Text>
        <Button
          label="Invite friends"
          onPress={() => Share.share({ message: shareText })}
          style={styles.heroButton}
        />
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{referral.inviteCount}</Text>
          <Text style={styles.statLabel}>Friends invited</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            ₹{referral.earnings.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Total earnings</Text>
        </View>
      </View>

      {referral.pendingCount > 0 && (
        <Text style={styles.pending}>
          {referral.pendingCount} invite{referral.pendingCount !== 1 ? 's' : ''} pending — you earn
          once they place their first order.
        </Text>
      )}

      <Card style={styles.applyCard}>
        <Text style={styles.applyTitle}>Have a referral code?</Text>
        <Input
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().replace(/\s/g, ''))}
          placeholder="FRIEND123"
          autoCapitalize="characters"
          maxLength={20}
        />
        {applyReferral.isError && (
          <Text style={styles.error}>{(applyReferral.error as Error).message}</Text>
        )}
        {applyReferral.isSuccess && (
          <Text style={styles.success}>
            Code applied. Your credit lands once your first order is delivered.
          </Text>
        )}
        <Button
          label="Apply code"
          variant="secondary"
          loading={applyReferral.isPending}
          disabled={code.trim().length < 4 || applyReferral.isSuccess}
          onPress={() => applyReferral.mutate(code.trim())}
        />
      </Card>

      <Text style={styles.terms}>
        Earn ₹50 for each friend who places their first order. Terms apply.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },

  hero: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2E5E4E26',
    padding: 24,
    gap: 6,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroEmoji: { fontSize: 26 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted },
  heroCode: { fontSize: 30, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 3 },
  heroButton: { alignSelf: 'stretch', marginTop: 12 },

  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted },
  pending: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

  applyCard: { gap: 10 },
  applyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  error: { fontSize: 12, color: '#dc2626' },
  success: { fontSize: 12, color: COLORS.success },
  terms: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },

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
