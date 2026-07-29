import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useCreateSupportTicketMutation,
  useSupportArticlesQuery,
  useSupportCategoriesQuery,
  useSupportTicketsQuery,
} from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

type Tab = 'tickets' | 'help';

function statusTone(status: string): 'success' | 'warning' | 'info' | 'neutral' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'ESCALATED') return 'warning';
  if (status === 'OPEN' || status === 'IN_PROGRESS') return 'info';
  return 'neutral';
}

export function SupportScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('tickets');
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState('');

  const { data: tickets, isLoading: ticketsLoading } = useSupportTicketsQuery();
  const { data: categories = [] } = useSupportCategoriesQuery();
  const { data: articles = [], isLoading: articlesLoading } = useSupportArticlesQuery(
    query.trim() || undefined,
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(
          [
            { value: 'tickets' as const, label: 'My tickets' },
            { value: 'help' as const, label: 'Help articles' },
          ]
        ).map((option) => (
          <Pressable
            key={option.value}
            style={[styles.tab, tab === option.value && styles.tabActive]}
            onPress={() => setTab(option.value)}
          >
            <Text style={[styles.tabText, tab === option.value && styles.tabTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'tickets' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Button label="＋ Raise a new ticket" onPress={() => setComposing(true)} />

          {ticketsLoading ? (
            <Loader />
          ) : !tickets?.items.length ? (
            <View style={styles.stateWrap}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>💬</Text>
              </View>
              <Text style={styles.stateTitle}>No support tickets</Text>
              <Text style={styles.stateText}>
                Raise a ticket and our team will get back to you here.
              </Text>
            </View>
          ) : (
            tickets.items.map((ticket) => (
              <Pressable
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() =>
                  router.push({ pathname: '/profile/support/[id]', params: { id: ticket.id } })
                }
              >
                <View style={styles.ticketHead}>
                  <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                  <Badge label={ticket.status.replace(/_/g, ' ')} tone={statusTone(ticket.status)} />
                </View>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketMeta}>
                  {ticket.category?.name ? `${ticket.category.name} · ` : ''}
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Input value={query} onChangeText={setQuery} placeholder="Search help articles" />
          {articlesLoading ? (
            <Loader />
          ) : articles.length === 0 ? (
            <Text style={styles.stateText}>No articles matched that search.</Text>
          ) : (
            articles.map((article) => (
              <Card key={article.id} style={styles.articleCard}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleBody}>{article.body}</Text>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <NewTicketModal
        visible={composing}
        categories={categories}
        onClose={() => setComposing(false)}
      />
    </View>
  );
}

function NewTicketModal({
  visible,
  categories,
  onClose,
}: {
  visible: boolean;
  categories: { id: string; code: string; name: string }[];
  onClose: () => void;
}) {
  const createTicket = useCreateSupportTicketMutation();
  const [categoryCode, setCategoryCode] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const effectiveCategory = categoryCode ?? categories[0]?.code ?? null;
  // Matches CreateTicketDto's @MinLength constraints.
  const valid = !!effectiveCategory && subject.trim().length >= 3 && description.trim().length >= 10;

  const reset = () => {
    setCategoryCode(null);
    setSubject('');
    setDescription('');
    createTicket.reset();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.modalTitle}>Raise a support ticket</Text>

          {categories.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipWrap}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[styles.chip, effectiveCategory === category.code && styles.chipActive]}
                    onPress={() => setCategoryCode(category.code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        effectiveCategory === category.code && styles.chipTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Input
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Order arrived with items missing"
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>What happened?</Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Give us the details — order number, what went wrong, and what you'd like us to do."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
            />
          </View>

          {createTicket.isError && (
            <Text style={styles.error}>{(createTicket.error as Error).message}</Text>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            label="Cancel"
            variant="secondary"
            style={styles.modalButton}
            onPress={() => {
              reset();
              onClose();
            }}
          />
          <Button
            label="Submit"
            style={styles.modalButton}
            loading={createTicket.isPending}
            disabled={!valid}
            onPress={() =>
              createTicket.mutate(
                {
                  categoryCode: effectiveCategory!,
                  subject: subject.trim(),
                  description: description.trim(),
                },
                {
                  onSuccess: () => {
                    reset();
                    onClose();
                  },
                },
              )
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#f8fafc',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },

  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 6,
  },
  ticketHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketNumber: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  ticketSubject: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  ticketMeta: { fontSize: 11, color: COLORS.textMuted },

  articleCard: { gap: 6 },
  articleTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  articleBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },
  textarea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    minHeight: 130,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, color: '#dc2626' },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  modalButton: { flex: 1 },

  stateWrap: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 26 },
  stateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  stateText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 },
});
