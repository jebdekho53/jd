import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useEnsureLocation } from '@/hooks/use-location';
import { useLocationStore } from '@/store/location-store';
import { useCategoriesQuery, useCategoryStoresQuery, useStoreProductsQuery } from '@/hooks/use-buyer-queries';
import { findCategoryBySlug, getCategoryAncestors } from '@/lib/categories';
import { Loader } from '@/components/ui/loader';
import type { CategoryItem, StoreCardWithCount } from '@/types/buyer';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

/** Recursive category drill-down — the same screen renders at every depth
 *  (top-level department, subcategory, sub-subcategory…), matching
 *  buyer-web's /categories/[slug]: subcategories (if any) render as tiles
 *  that push this same route with the child's slug, and stores selling this
 *  exact category render below. A leaf category (no children) just shows
 *  the stores section directly. */
export function CategoryDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  useEnsureLocation();
  const { lat, lng, pincode } = useLocationStore();
  const { data: categories = [], isLoading: catLoading } = useCategoriesQuery();

  const category = useMemo(() => findCategoryBySlug(categories, slug), [categories, slug]);
  const ancestors = useMemo(
    () => (category ? getCategoryAncestors(categories, category.slug).slice(0, -1) : []),
    [categories, category],
  );

  const hasLocation = lat != null && lng != null;
  const {
    data: storesData,
    isLoading: storesLoading,
  } = useCategoryStoresQuery(
    category?.id ?? '',
    { lat: lat ?? 0, lng: lng ?? 0, pincode: pincode ?? undefined, radiusKm: 20, page: 1, limit: 12 },
    Boolean(category?.id && hasLocation),
  );
  const stores = storesData?.stores ?? [];

  if (catLoading) return <Loader fullScreen />;
  if (!category) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Category not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: category.name }} />
      {ancestors.length > 0 && (
        <Text style={styles.breadcrumb} numberOfLines={1}>
          {['Categories', ...ancestors.map((a) => a.name)].join(' / ')}
        </Text>
      )}
      <Text style={styles.title}>{category.name}</Text>

      {category.children.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subcategories</Text>
          <FlatList
            data={category.children}
            keyExtractor={(c) => c.id}
            numColumns={3}
            columnWrapperStyle={styles.subGrid}
            scrollEnabled={false}
            renderItem={({ item }) => <SubcategoryTile category={item} />}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Stores selling {category.name}
          {stores.length > 0 ? ` · ${stores.length} nearby` : ''}
        </Text>
        {!hasLocation ? (
          <EmptyBlock text="Set your delivery location to see stores in this category." />
        ) : storesLoading ? (
          <Loader />
        ) : stores.length === 0 ? (
          <EmptyBlock text="No approved stores in this category deliver to your area yet." />
        ) : (
          <View style={{ gap: 14 }}>
            {stores.map((store) => (
              <StoreWithProducts key={store.id} store={store} categoryId={category!.id} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SubcategoryTile({ category }: { category: CategoryItem }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.subTile}
      onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: category.slug } })}
    >
      <View style={styles.subImageWrap}>
        {category.imageUrl ? (
          <Image source={{ uri: category.imageUrl }} style={styles.subImage} />
        ) : (
          <Text style={styles.subLetter}>{category.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <Text style={styles.subName} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

function StoreWithProducts({ store, categoryId }: { store: StoreCardWithCount; categoryId: string }) {
  const router = useRouter();
  const { data, isLoading } = useStoreProductsQuery(store.slug, { categoryId, page: 1, limit: 8 });
  const products = data?.products ?? [];

  return (
    <View style={styles.storeCard}>
      <Pressable
        style={styles.storeHeader}
        onPress={() => router.push({ pathname: '/store/[slug]', params: { slug: store.slug } })}
      >
        {store.logoUrl ? (
          <Image source={{ uri: store.logoUrl }} style={styles.storeLogo} />
        ) : (
          <View style={[styles.storeLogo, styles.imagePlaceholder]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
          <View style={styles.storeMetaRow}>
            {store.ratingAvg > 0 && <Text style={styles.storeMeta}>★ {store.ratingAvg.toFixed(1)}</Text>}
            <Text style={styles.storeMeta}>{store.avgPrepTimeMins} min</Text>
            {!store.isOpen && <Text style={styles.storeClosed}>Closed</Text>}
          </View>
        </View>
        <Text style={styles.storeArrow}>›</Text>
      </Pressable>

      {isLoading ? (
        <Loader />
      ) : products.length > 0 ? (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productRow}
          renderItem={({ item }) => (
            <Pressable
              style={styles.productCard}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id, store: store.slug } })}
            >
              {item.imageUrls[0] ? (
                <Image source={{ uri: item.imageUrls[0] }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.imagePlaceholder]} />
              )}
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productPrice}>₹{item.basePrice}</Text>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <View style={styles.emptyBlock}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32, gap: 4 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 14, color: COLORS.textMuted },

  breadcrumb: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2, marginBottom: 12 },

  section: { marginTop: 14, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },

  subGrid: { gap: 10 },
  subTile: { flex: 1 / 3, alignItems: 'center', gap: 6, marginBottom: 14 },
  subImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  subImage: { width: '100%', height: '100%' },
  subLetter: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  subName: { fontSize: 10, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

  storeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 10,
  },
  storeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storeLogo: { width: 44, height: 44, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: '#e2e8f0' },
  storeName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  storeMetaRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  storeMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  storeClosed: { fontSize: 11, color: '#dc2626', fontWeight: '700' },
  storeArrow: { fontSize: 20, color: '#cbd5e1' },

  productRow: { gap: 10 },
  productCard: { width: 110, gap: 4 },
  productImage: { width: 110, height: 110, borderRadius: 12 },
  productName: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  productPrice: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  emptyBlock: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});
