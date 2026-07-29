import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRewardsQuery } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import type { LoyaltyTier } from '@/types/wallet';

const TIER_STYLES: Record<LoyaltyTier, { bg: string; text: string }> = {
  bronze: { bg: '#fef3c7', text: '#92400e' },
  silver: { bg: '#e2e8f0', text: '#334155' },
  gold: { bg: '#fef9c3', text: '#854d0e' },
  platinum: { bg: '#ede9fe', text: '#5b21b6' },
};

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  success: '#16a34a',
  danger: '#dc2626',
};

export function RewardsScreen() {
  const { data: rewards, isLoading, isError, refetch, isRefetching } = useRewardsQuery();

  if (isLoading) return <Loader fullScreen />;

  if (isError || !rewards) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load rewards</Text>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  const tierStyle = TIER_STYLES[rewards.tier] ?? TIER_STYLES.bronze;
  const remaining = Math.max(0, rewards.nextTierPoints - rewards.points);
  const progress =
    rewards.nextTierPoints > 0
      ? Math.min(100, (rewards.points / rewards.nextTierPoints) * 100)
      : 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.subtitle}>Earn points on every order</Text>

      <View style={styles.hero}>
        <View style={styles.heroHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>Your points</Text>
            <Text style={styles.heroValue}>{rewards.points}</Text>
          </View>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🏅</Text>
          </View>
        </View>

        <View style={[styles.tierBadge, { backgroundColor: tierStyle.bg }]}>
          <Text style={[styles.tierText, { color: tierStyle.text }]}>{rewards.tier} tier</Text>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Progress to next tier</Text>
            <Text style={styles.progressLabel}>{remaining} pts to go</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Text style={styles.lifetime}>{rewards.lifetimePoints} points earned all-time</Text>
      </View>

      <Text style={styles.sectionTitle}>📈 Reward history</Text>
      {rewards.history.length === 0 ? (
        <Text style={styles.emptyText}>No reward activity yet.</Text>
      ) : (
        rewards.history.map((entry) => (
          <View key={entry.id} style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{entry.description ?? entry.type}</Text>
              <Text style={styles.historyDate}>
                {new Date(entry.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
            <Text style={[styles.historyPoints, entry.points < 0 ? styles.spent : styles.earned]}>
              {entry.points < 0 ? '' : '+'}
              {entry.points}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },

  hero: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    gap: 12,
  },
  heroHead: { flexDirection: 'row', alignItems: 'flex-start' },
  heroLabel: { fontSize: 13, color: COLORS.textMuted },
  heroValue: { fontSize: 36, fontWeight: '800', color: COLORS.textPrimary },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 22 },
  tierBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tierText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },

  progressBlock: { gap: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, color: COLORS.textMuted },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: COLORS.cream, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: COLORS.primary },
  lifetime: { fontSize: 11, color: COLORS.textMuted },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginTop: 6 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  historyDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  historyPoints: { fontSize: 14, fontWeight: '800' },
  earned: { color: COLORS.success },
  spent: { color: COLORS.danger },

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
