import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategoriesQuery } from '@/hooks/use-buyer-queries';
import { flattenCategories } from '@/lib/categories';
import { Loader } from '@/components/ui/loader';
import type { CategoryItem } from '@/types/buyer';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

/** Mirrors buyer-web's /categories: all top-level departments in a grid, with
 *  search flattening across every level so a subcategory is still findable
 *  by name. Tapping a tile pushes /category/[slug], the same recursive
 *  drill-down screen used for every depth. */
export function CategoriesScreen() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategoriesQuery();
  const [query, setQuery] = useState('');

  const flat = useMemo(() => flattenCategories(categories), [categories]);
  const isSearching = query.trim().length > 0;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return categories;
    return flat.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(normalized));
  }, [categories, flat, query]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>Browse aisles and departments from nearby stores</Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search categories like dairy, snacks, atta…"
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
            </View>
            {!isLoading && (
              <Text style={styles.count}>
                {isSearching ? `${filtered.length} matches` : `${filtered.length} departments`}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <Loader />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={styles.emptyTitle}>No category found</Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => router.push({ pathname: '/search', params: { q: query } })}
              >
                <Text style={styles.emptyButtonText}>Search products instead</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => <CategoryTile category={item} showChildPreview={!isSearching} />}
      />
    </View>
  );
}

function CategoryTile({ category, showChildPreview }: { category: CategoryItem; showChildPreview: boolean }) {
  const router = useRouter();
  const childPreview =
    showChildPreview && category.children.length > 0
      ? category.children
          .slice(0, 2)
          .map((c) => c.name)
          .join(' · ') + (category.children.length > 2 ? ` +${category.children.length - 2}` : '')
      : null;

  return (
    <Pressable
      style={styles.tile}
      onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: category.slug } })}
    >
      <View style={styles.tileImageWrap}>
        {category.imageUrl ? (
          <Image source={{ uri: category.imageUrl }} style={styles.tileImage} />
        ) : (
          <Text style={styles.tileLetter}>{category.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <Text style={styles.tileName} numberOfLines={2}>
        {category.name}
      </Text>
      {childPreview && (
        <Text style={styles.tileChildren} numberOfLines={1}>
          {childPreview}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  header: { gap: 10, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  searchBar: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    height: 46,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  count: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  row: { gap: 10 },
  tile: { flex: 1 / 3, alignItems: 'center', gap: 6, marginBottom: 18 },
  tileImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileImage: { width: '100%', height: '100%' },
  tileLetter: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  tileName: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  tileChildren: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  emptyButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
