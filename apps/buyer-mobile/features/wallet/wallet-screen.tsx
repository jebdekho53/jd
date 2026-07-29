import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useWalletQuery } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  success: '#16a34a',
  danger: '#dc2626',
};

export function WalletScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useWalletQuery();

  if (isLoading) return <Loader fullScreen />;

  if (isError || !data) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load wallet</Text>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.subtitle}>Balance, rewards & referrals</Text>

      <View style={styles.statRow}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statLabel}>💰 Wallet balance</Text>
          <Text style={styles.statValue}>₹{data.balance.toFixed(2)}</Text>
          {data.expiringCreditsCount > 0 && (
            <Text style={styles.expiring}>
              {data.expiringCreditsCount} credit{data.expiringCreditsCount !== 1 ? 's' : ''} expiring
              soon
            </Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>🏅 Reward points</Text>
          <Text style={styles.statValue}>{data.rewardPoints}</Text>
          <Text style={styles.statHint}>{data.tier.toLowerCase()} tier</Text>
        </View>
      </View>

      <View style={styles.linkRow}>
        <Pressable style={styles.link} onPress={() => router.push('/profile/rewards')}>
          <Text style={styles.linkText}>🎁 Rewards history</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/profile/referrals')}>
          <Text style={styles.linkText}>👥 Refer & earn</Text>
        </Pressable>
      </View>

      {!!data.referralCode && (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
          <Text style={styles.codeValue}>{data.referralCode}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        {data.transactions.length === 0 ? (
          <Text style={styles.emptyText}>No wallet activity yet.</Text>
        ) : (
          <View style={styles.txList}>
            {data.transactions.map((tx, index) => (
              <View key={tx.id} style={[styles.txRow, index > 0 && styles.txRowDivided]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {tx.description ?? tx.type}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={[styles.txAmount, tx.type === 'DEBIT' ? styles.txDebit : styles.txCredit]}>
                  {tx.type === 'DEBIT' ? '−' : '+'}₹{tx.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 14 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },

  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 4,
  },
  statCardPrimary: { backgroundColor: COLORS.cream, borderColor: '#e8e2c8' },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  statHint: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  expiring: { fontSize: 11, fontWeight: '600', color: '#b45309' },

  linkRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  link: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  linkText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },

  codeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E5E4E26',
    backgroundColor: '#2E5E4E0d',
    padding: 14,
  },
  codeLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.6 },
  codeValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 4, letterSpacing: 2 },

  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 },
  txList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  txRowDivided: { borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  txTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  txDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  txCredit: { color: COLORS.success },
  txDebit: { color: COLORS.danger },

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
