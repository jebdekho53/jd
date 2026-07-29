import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useRemoveWishlistItemMutation, useWishlistQuery } from '@/hooks/use-wishlist';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  danger: '#dc2626',
};

export function WishlistScreen() {
  const router = useRouter();
  const { data: items, isLoading, isError, refetch, isRefetching } = useWishlistQuery();
  const removeItem = useRemoveWishlistItemMutation();

  if (isLoading) return <Loader fullScreen />;

  if (isError) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load your wishlist</Text>
        <Button label="Retry" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        <Text style={styles.subtitle}>
          {items?.length ?? 0} saved item{(items?.length ?? 0) !== 1 ? 's' : ''}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.stateWrap}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>♡</Text>
          </View>
          <Text style={styles.stateTitle}>Nothing saved yet</Text>
          <Text style={styles.stateText}>
            Tap the heart on a product to keep it here for later.
          </Text>
          <Button label="Browse products" onPress={() => router.push('/search')} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/product/[id]',
                params: { id: item.productId, ...(item.store ? { store: item.store.slug } : {}) },
              })
            }
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Text style={styles.placeholderHeart}>♡</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            {item.store && <Text style={styles.storeName}>{item.store.name}</Text>}
            <Text style={styles.price}>
              ₹{item.price.toFixed(2)}
              <Text style={styles.unit}> / {item.unit}</Text>
            </Text>

            <View style={styles.actions}>
              <Pressable
                style={styles.primaryAction}
                onPress={() =>
                  router.push({
                    pathname: '/product/[id]',
                    params: {
                      id: item.productId,
                      ...(item.store ? { store: item.store.slug } : {}),
                    },
                  })
                }
              >
                <Text style={styles.primaryActionText}>🛒 Move to cart</Text>
              </Pressable>
              <Pressable
                style={styles.removeAction}
                disabled={removeItem.isPending}
                onPress={() => removeItem.mutate(item.productId)}
              >
                <Text style={styles.removeActionText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },

  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  image: { width: 80, height: 80, borderRadius: 12 },
  placeholder: { backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' },
  placeholderHeart: { fontSize: 24, color: COLORS.textMuted },
  cardBody: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  storeName: { fontSize: 12, color: COLORS.textMuted },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  unit: { fontSize: 11, fontWeight: '400', color: COLORS.textMuted },

  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  primaryAction: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  primaryActionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  removeAction: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  removeActionText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },

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
  emptyEmoji: { fontSize: 28, color: COLORS.primary },
  stateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  stateText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 },
});
