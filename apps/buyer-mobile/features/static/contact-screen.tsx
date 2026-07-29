import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORT_EMAIL } from '@/content/help-content';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

export function ContactScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Contact support</Text>
        <Text style={styles.subtitle}>
          We can help with orders, payments, delivery, refunds, and account questions.
        </Text>
      </View>

      <Pressable style={styles.primaryCard} onPress={() => router.push('/profile/support')}>
        <Text style={styles.primaryEmoji}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryTitle}>Raise a support ticket</Text>
          <Text style={styles.primaryText}>
            The fastest route — your order details come along automatically and replies land in this
            app.
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      >
        <Text style={styles.cardEmoji}>✉️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Email us</Text>
          <Text style={styles.cardValue}>{SUPPORT_EMAIL}</Text>
          <Text style={styles.cardHint}>Include your order number so we can pull it up quickly.</Text>
        </View>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/legal/faq')}>
        <Text style={styles.cardEmoji}>❓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Browse FAQs</Text>
          <Text style={styles.cardHint}>
            Most questions about delivery, refunds and payments are answered there.
          </Text>
        </View>
      </Pressable>

      <View style={styles.legalBlock}>
        <Text style={styles.legalTitle}>Registered entity</Text>
        <Text style={styles.legalText}>
          JebDekho is owned and operated by UrbanMove Services Private Limited.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  header: { gap: 4, marginBottom: 2 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  primaryCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    padding: 18,
  },
  primaryEmoji: { fontSize: 24 },
  primaryTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  primaryText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginTop: 3 },

  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  cardEmoji: { fontSize: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
  cardHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 17 },

  legalBlock: { gap: 4, paddingHorizontal: 4, marginTop: 8 },
  legalTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  legalText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
});
