import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import {
  useInboxQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function InboxScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useInboxQuery(1);
  const markRead = useMarkNotificationReadMutation();
  const markAll = useMarkAllNotificationsReadMutation();

  if (isLoading) return <Loader fullScreen />;

  if (isError || !data) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load notifications</Text>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={data.items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {data.unread > 0 ? `${data.unread} unread` : 'All caught up'}
          </Text>
          {data.unread > 0 && (
            <Pressable onPress={() => markAll.mutate()} disabled={markAll.isPending}>
              <Text style={styles.markAll}>✓✓ Mark all read</Text>
            </Pressable>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.stateWrap}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🔔</Text>
          </View>
          <Text style={styles.stateTitle}>No notifications yet</Text>
          <Text style={styles.stateText}>
            Order updates and account notices will show up here.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, !item.isRead && styles.cardUnread]}
          onPress={() => {
            if (!item.isRead) markRead.mutate(item.id);
          }}
        >
          <View style={styles.cardHead}>
            {!item.isRead && <View style={styles.unreadDot} />}
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardBody}>{item.body}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  markAll: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 4,
  },
  cardUnread: { borderColor: '#2E5E4E40', backgroundColor: '#f6faf8' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: COLORS.primary },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardTime: { fontSize: 11, color: COLORS.textMuted },
  cardBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
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
