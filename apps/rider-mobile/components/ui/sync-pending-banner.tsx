import { View, Text, StyleSheet } from 'react-native';
import { useSyncStore } from '@/store/sync-store';

export function SyncPendingBanner() {
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const isSyncing = useSyncStore((s) => s.isSyncing);

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {isSyncing
          ? 'Syncing pending updates…'
          : `${pendingCount} update${pendingCount === 1 ? '' : 's'} waiting to sync`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  text: { fontSize: 13, fontWeight: '600', color: '#92400e', textAlign: 'center' },
});
