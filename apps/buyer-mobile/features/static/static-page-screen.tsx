import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { StaticPage, StaticSection } from '@/content/static-pages';

const COLORS = {
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  primary: '#2E5E4E',
};

/** Renders the shared prose layout used by every informational screen. */
export function StaticPageScreen({ page }: { page: StaticPage }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </View>
      {page.sections.map((section, index) => (
        <Section key={section.heading ?? `section-${index}`} section={section} />
      ))}
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

export function Section({ section }: { section: StaticSection }) {
  return (
    <View style={styles.section}>
      {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
      {section.body?.map((paragraph) => (
        <Text key={paragraph} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
      {section.list?.map((item) => (
        <View key={item} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 18 },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  section: { gap: 8 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4 },
  paragraph: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  listRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  bullet: { fontSize: 14, color: COLORS.primary, lineHeight: 22 },
  listText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});
