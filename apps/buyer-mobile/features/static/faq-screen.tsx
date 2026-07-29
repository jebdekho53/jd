import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FAQ_ITEMS, HELP_SECTIONS } from '@/content/help-content';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

type CategoryFilter = 'all' | (typeof HELP_SECTIONS)[number]['id'];

/** buyer-web splits this across /faq and /help; on mobile the category filter
 *  and the accordion sit on one screen. */
export function FaqScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const items = useMemo(
    () => (category === 'all' ? FAQ_ITEMS : FAQ_ITEMS.filter((i) => i.category === category)),
    [category],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & FAQs</Text>
        <Text style={styles.subtitle}>
          Quick answers about shopping, delivery, payments, refunds, and support on JebDekho.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" active={category === 'all'} onPress={() => setCategory('all')} />
        {HELP_SECTIONS.map((section) => (
          <Chip
            key={section.id}
            label={section.title}
            active={category === section.id}
            onPress={() => setCategory(section.id)}
          />
        ))}
      </ScrollView>

      {category !== 'all' && (
        <Text style={styles.categoryHint}>
          {HELP_SECTIONS.find((s) => s.id === category)?.description}
        </Text>
      )}

      {items.map((item) => {
        const open = openQuestion === item.q;
        return (
          <Pressable
            key={item.q}
            style={[styles.faqCard, open && styles.faqCardOpen]}
            onPress={() => setOpenQuestion(open ? null : item.q)}
          >
            <View style={styles.faqHead}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.toggle}>{open ? '−' : '+'}</Text>
            </View>
            {open && <Text style={styles.answer}>{item.a}</Text>}
          </Pressable>
        );
      })}

      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Need more help?</Text>
        <Text style={styles.ctaText}>
          Our support team can help with order issues, delivery updates, refunds, payment failures,
          missing items, damaged products, and account problems.
        </Text>
        <Pressable style={styles.ctaButton} onPress={() => router.push('/profile/support')}>
          <Text style={styles.ctaButtonText}>Contact support</Text>
        </Pressable>
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 10 },
  header: { gap: 4, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },
  categoryHint: { fontSize: 12, color: COLORS.textMuted },

  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 10,
  },
  faqCardOpen: { borderColor: '#2E5E4E40', backgroundColor: '#f6faf8' },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  question: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  toggle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  answer: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 21 },

  ctaCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    marginTop: 8,
  },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  ctaText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  ctaButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
