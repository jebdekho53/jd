import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { TodayEarningsCard } from '@/features/earnings/today-earnings-card';
import { WeeklyChart } from '@/features/earnings/weekly-chart';
import { EarningsHistoryList } from '@/features/earnings/earnings-history-list';
import {
  useEarningsHistoryQuery,
  useEarningsQuery,
  useTodayEarningsQuery,
} from '@/hooks/use-earnings';
import { Loader } from '@/components/ui/loader';

export function EarningsScreen() {
  const summary = useEarningsQuery();
  const today = useTodayEarningsQuery();
  const history = useEarningsHistoryQuery();

  const loading = summary.isLoading || today.isLoading || history.isLoading;
  const refetching = summary.isRefetching || today.isRefetching || history.isRefetching;

  const refetchAll = () => {
    void summary.refetch();
    void today.refetch();
    void history.refetch();
  };

  if (loading) return <Loader fullScreen label="Loading earnings…" />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refetching} onRefresh={refetchAll} />}
    >
      <TodayEarningsCard
        amount={today.data?.amount ?? 0}
        deliveries={today.data?.deliveries ?? 0}
      />
      <WeeklyChart
        weeklyTotal={summary.data?.thisWeek ?? 0}
        deliveryCount={summary.data?.deliveryCount ?? 0}
      />
      <EarningsHistoryList items={history.data ?? []} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
});
