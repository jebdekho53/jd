import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLocationStore } from '@/store/location-store';
import { useProductSearchQuery } from '@/hooks/use-buyer-queries';
import { Loader } from '@/components/ui/loader';

export function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const { lat, lng, pincode } = useLocationStore();
  const [query, setQuery] = useState('');

  const searchResult = useProductSearchQuery(
    {
      q: query || undefined,
      categoryId: params.categoryId,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      pincode: pincode ?? undefined,
      limit: 30,
    },
    true,
  );

  const products = searchResult.data?.products ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search milk, atta, snacks, fruits..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          searchResult.isLoading ? (
            <Loader />
          ) : (
            <Text style={styles.empty}>
              {query || params.categoryId ? 'No products found' : 'Search for a product to get started'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id, store: item.store.slug } })}
          >
            {item.imageUrls[0] ? (
              <Image source={{ uri: item.imageUrls[0] }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.store}>{item.store.name}</Text>
              <Text style={styles.price}>₹{item.basePrice}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchRow: { padding: 16 },
  search: {
    height: 46,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  image: { width: 56, height: 56, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: '#e2e8f0' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  store: { fontSize: 12, color: '#64748b', marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: '#2E5E4E', marginTop: 4 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
