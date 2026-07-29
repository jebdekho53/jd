import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useStoreProductsQuery, useStoreQuery } from '@/hooks/use-buyer-queries';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';

export function StoreScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: store, isLoading: storeLoading } = useStoreQuery(slug);
  const { data: productsResult, isLoading: productsLoading } = useStoreProductsQuery(slug);

  if (storeLoading) return <Loader fullScreen />;
  if (!store) return <Text style={styles.empty}>Store not found</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {store.logoUrl ? (
          <Image source={{ uri: store.logoUrl }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{store.name}</Text>
          <Text style={styles.meta}>
            {store.ratingAvg > 0 ? `★ ${store.ratingAvg.toFixed(1)} · ` : ''}Min order ₹{store.minOrderAmount}
          </Text>
          {!store.isOpen && <Badge label="Closed now" tone="warning" />}
        </View>
      </View>

      <FlatList
        data={productsResult?.products ?? []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={productsLoading ? <Loader /> : <Text style={styles.empty}>No products yet</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id, store: slug } })}
          >
            {item.imageUrls[0] ? (
              <Image source={{ uri: item.imageUrls[0] }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.logoPlaceholder]} />
            )}
            <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.cardPrice}>₹{item.basePrice}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff' },
  logo: { width: 56, height: 56, borderRadius: 12 },
  logoPlaceholder: { backgroundColor: '#e2e8f0' },
  headerInfo: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 13, color: '#64748b' },
  grid: { padding: 12, gap: 12 },
  row: { gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  cardImage: { width: '100%', height: 100, borderRadius: 10 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#2E5E4E' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
