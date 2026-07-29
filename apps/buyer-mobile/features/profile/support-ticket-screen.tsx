import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useReplyToSupportTicketMutation, useSupportTicketQuery } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
};

function statusTone(status: string): 'success' | 'warning' | 'info' | 'neutral' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'ESCALATED') return 'warning';
  if (status === 'OPEN' || status === 'IN_PROGRESS') return 'info';
  return 'neutral';
}

export function SupportTicketScreen({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError, refetch } = useSupportTicketQuery(ticketId);
  const reply = useReplyToSupportTicketMutation(ticketId);
  const [body, setBody] = useState('');

  if (isLoading) return <Loader fullScreen />;

  if (isError || !ticket) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Ticket not found</Text>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  const closed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
            <Badge label={ticket.status.replace(/_/g, ' ')} tone={statusTone(ticket.status)} />
          </View>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <Text style={styles.meta}>
            {ticket.category?.name ? `${ticket.category.name} · ` : ''}
            Raised {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
          </Text>
        </View>

        <View style={[styles.message, styles.messageMine]}>
          <Text style={styles.messageAuthor}>You</Text>
          <Text style={styles.messageBody}>{ticket.description}</Text>
        </View>

        {ticket.messages?.map((message) => {
          const mine = message.authorType === 'BUYER';
          return (
            <View key={message.id} style={[styles.message, mine ? styles.messageMine : styles.messageTheirs]}>
              <Text style={styles.messageAuthor}>{mine ? 'You' : 'Support'}</Text>
              <Text style={styles.messageBody}>{message.body}</Text>
              <Text style={styles.messageTime}>
                {new Date(message.createdAt).toLocaleString('en-IN')}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {closed ? (
        <Text style={styles.closedNote}>This ticket is closed. Raise a new one if you still need help.</Text>
      ) : (
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Write a reply…"
            placeholderTextColor="#94a3b8"
            multiline
          />
          {reply.isError && <Text style={styles.error}>{(reply.error as Error).message}</Text>}
          <Button
            label="Send reply"
            loading={reply.isPending}
            disabled={!body.trim()}
            onPress={() => reply.mutate(body.trim(), { onSuccess: () => setBody('') })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 10 },

  header: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketNumber: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  subject: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  meta: { fontSize: 11, color: COLORS.textMuted },

  message: { borderRadius: 14, padding: 12, gap: 4, maxWidth: '92%' },
  messageMine: { alignSelf: 'flex-end', backgroundColor: '#e8f2ee' },
  messageTheirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  messageAuthor: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  messageBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  messageTime: { fontSize: 10, color: COLORS.textMuted },

  replyBar: {
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12, color: '#dc2626' },
  closedNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },

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
