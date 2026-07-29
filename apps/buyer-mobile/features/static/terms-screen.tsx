import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getLegalDocument } from '@/services/buyer-api';
import { Section } from '@/features/static/static-page-screen';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
};

/**
 * Renders the live BUYER_TERMS document from apps/api's legal registry rather
 * than a hardcoded copy, so the words here are byte-identical to the version
 * recorded against a buyer's acceptance at checkout.
 */
export function TermsScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['legal', 'document', 'BUYER_TERMS'],
    queryFn: () => getLegalDocument('BUYER_TERMS'),
    staleTime: 10 * 60_000,
  });

  if (isLoading) return <Loader fullScreen />;

  if (isError || !data) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load the terms</Text>
        <Text style={styles.stateText}>
          {error instanceof Error ? error.message : 'Please try again in a moment.'}
        </Text>
        <Button label="Retry" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>
          Version {data.version} · Effective {data.effectiveDate}
        </Text>
        <Text style={styles.summary}>{data.summary}</Text>
      </View>

      {data.sections.map((section) => (
        <Section key={section.heading} section={section} />
      ))}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 18 },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textMuted },
  summary: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, marginTop: 4 },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: '#fff',
  },
  stateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  stateText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 },
});
