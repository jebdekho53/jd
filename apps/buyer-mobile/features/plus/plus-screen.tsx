import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { usePlusMeQuery, usePlusPlansQuery, useSubscribeToPlusMutation } from '@/hooks/use-plus';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { BENEFIT_LABELS, type MembershipPlan } from '@/types/plus';

export function PlusScreen() {
  const { data: me, isLoading: meLoading } = usePlusMeQuery();
  const { data: plans, isLoading: plansLoading } = usePlusPlansQuery();
  const subscribe = useSubscribeToPlusMutation();
  const [error, setError] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  if (meLoading || plansLoading) return <Loader fullScreen />;

  const activeSub = me?.subscription;

  const handleSubscribe = async (planId: string) => {
    setError(null);
    try {
      await subscribe.mutateAsync({ planId, yearly });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⭐</Text>
        <Text style={styles.heroTitle}>JebDekho Plus</Text>
        <Text style={styles.heroSubtitle}>Free delivery, priority slots and more.</Text>
      </View>

      {activeSub && (
        <View style={styles.activeCard}>
          <View style={styles.activeHeaderRow}>
            <Text style={styles.activePlanName}>{activeSub.plan.name}</Text>
            <Badge label="Active" tone="success" />
          </View>
          <Text style={styles.activeExpiry}>
            Renews {new Date(activeSub.expiresAt).toLocaleDateString()}
          </Text>
          {me && me.savings.savings > 0 && (
            <Text style={styles.activeSavings}>
              You have saved ₹{me.savings.savings.toFixed(0)} so far with {me.savings.usages} free
              {me.savings.usages === 1 ? ' delivery' : ' deliveries'}
            </Text>
          )}
        </View>
      )}

      {!activeSub && (
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleOption, !yearly && styles.toggleOptionActive]}
            onPress={() => setYearly(false)}
          >
            <Text style={[styles.toggleLabel, !yearly && styles.toggleLabelActive]}>Monthly</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, yearly && styles.toggleOptionActive]}
            onPress={() => setYearly(true)}
          >
            <Text style={[styles.toggleLabel, yearly && styles.toggleLabelActive]}>Yearly</Text>
          </Pressable>
        </View>
      )}

      {(plans ?? []).map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          yearly={yearly}
          isCurrent={activeSub?.planId === plan.id}
          onSubscribe={() => handleSubscribe(plan.id)}
          subscribing={subscribe.isPending}
        />
      ))}

      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

function PlanCard({
  plan,
  yearly,
  isCurrent,
  onSubscribe,
  subscribing,
}: {
  plan: MembershipPlan;
  yearly: boolean;
  isCurrent: boolean;
  onSubscribe: () => void;
  subscribing: boolean;
}) {
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  return (
    <View style={styles.planCard}>
      <View style={styles.planHeaderRow}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isCurrent && <Badge label="Current plan" tone="info" />}
      </View>
      <Text style={styles.planPrice}>
        ₹{Number(price).toFixed(0)} <Text style={styles.planPriceUnit}>/{yearly ? 'year' : 'month'}</Text>
      </Text>

      <View style={styles.benefitsList}>
        {plan.benefits.map((b) => (
          <Text key={b.id} style={styles.benefitRow}>✓ {BENEFIT_LABELS[b.type]}</Text>
        ))}
      </View>

      {!isCurrent && (
        <Button label="Subscribe" onPress={onSubscribe} loading={subscribing} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 14 },
  hero: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#2E5E4E',
    gap: 4,
  },
  heroEmoji: { fontSize: 32 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  activeCard: {
    backgroundColor: '#ecf5f1',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  activeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activePlanName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  activeExpiry: { fontSize: 12, color: '#64748b' },
  activeSavings: { fontSize: 13, color: '#16A34A', fontWeight: '600', marginTop: 4 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    padding: 4,
  },
  toggleOption: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  toggleOptionActive: { backgroundColor: '#fff' },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  toggleLabelActive: { color: '#0f172a' },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  planPrice: { fontSize: 22, fontWeight: '800', color: '#2E5E4E' },
  planPriceUnit: { fontSize: 13, fontWeight: '400', color: '#64748b' },
  benefitsList: { gap: 6 },
  benefitRow: { fontSize: 13, color: '#334155' },
  error: { color: '#dc2626', fontSize: 13, textAlign: 'center' },
});
