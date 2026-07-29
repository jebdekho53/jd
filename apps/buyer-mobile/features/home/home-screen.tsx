import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEnsureLocation } from '@/hooks/use-location';
import { useLocationStore } from '@/store/location-store';
import { useCategoriesQuery, useDiscoverStoresQuery, useProductSearchQuery } from '@/hooks/use-buyer-queries';
import { useCartQuery } from '@/hooks/use-cart';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import type { CategoryItem, StoreCard } from '@/types/buyer';

const COLORS = {
  primary: '#2E5E4E',
  secondary: '#3D7A66',
  accent: '#F59E0B',
  success: '#16A34A',
  danger: '#DC2626',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

const PROOF_POINTS = [
  { label: 'Verified local stores', emoji: '✅' },
  { label: 'Secure payments', emoji: '🔒' },
  { label: 'Price comparison', emoji: '⚖️' },
  { label: 'Fast delivery', emoji: '🚚' },
];

const COMMERCE_CTAS = [
  { title: 'JebDekho Plus', text: 'Unlock free delivery and member-only savings.', emoji: '👑' },
  { title: 'Refer & earn', text: 'Invite friends and earn wallet credits.', emoji: '🎁' },
  { title: 'Compare prices', text: 'Find the lowest nearby price before checkout.', emoji: '⚖️' },
];

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  return categories;
}

export function HomeScreen() {
  const router = useRouter();
  useEnsureLocation();
  const { lat, lng, pincode, label, permissionDenied } = useLocationStore();
  const { data: cart } = useCartQuery();
  const { data: categories = [] } = useCategoriesQuery();

  const hasLocation = lat != null && lng != null;
  const chips = useMemo(() => flattenCategories(categories).slice(0, 6), [categories]);
  const shelfCategories = useMemo(() => flattenCategories(categories).slice(0, 6), [categories]);

  const storesResult = useDiscoverStoresQuery(
    hasLocation ? { lat: lat!, lng: lng!, pincode: pincode ?? undefined, sort: 'distance', limit: 8 } : null,
  );
  const popularStoresResult = useDiscoverStoresQuery(
    hasLocation ? { lat: lat!, lng: lng!, pincode: pincode ?? undefined, sort: 'popular', limit: 8 } : null,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Utility row */}
      <View style={styles.utilityRow}>
        <Pressable style={styles.utilityButton} onPress={() => router.push('/restaurants')}>
          <Text style={styles.utilityButtonText}>🍽️ Food</Text>
        </Pressable>
        <Pressable style={styles.utilityButton} onPress={() => router.push('/orders')}>
          <Text style={styles.utilityButtonText}>📦 Orders</Text>
        </Pressable>
        <Pressable style={styles.utilityButton} onPress={() => router.push('/profile')}>
          <Text style={styles.utilityButtonText}>👤 Profile</Text>
        </Pressable>
        <Pressable style={[styles.utilityButton, styles.utilityButtonPrimary]} onPress={() => router.push('/cart')}>
          <Text style={styles.utilityButtonTextPrimary}>🛒 Cart</Text>
          {!!cart?.itemCount && <Badge label={String(cart.itemCount)} tone="success" />}
        </Pressable>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>LOCAL STORES, BETTER PRICES</Text>
        </View>
        <Text style={styles.heroTitle}>Groceries from nearby sellers, compared before checkout.</Text>
        <Text style={styles.heroSubtitle}>
          Search products, compare store prices, and order essentials from verified sellers around you.
        </Text>

        <View style={styles.heroStatsRow}>
          {[['Compare', 'prices'], ['Verified', 'stores'], ['Fast', 'delivery']].map(([value, label2]) => (
            <View key={value} style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{value}</Text>
              <Text style={styles.heroStatLabel}>{label2}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search milk, atta, snacks, fruits...</Text>
        </Pressable>

        {!!chips.length && (
          <FlatList
            horizontal
            data={chips}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroChipsRow}
            renderItem={({ item }) => (
              <Pressable
                style={styles.heroChip}
                onPress={() => router.push({ pathname: '/search', params: { categoryId: item.id } })}
              >
                <Text style={styles.heroChipText}>{item.name}</Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* Location / delivering-to card */}
      <Pressable style={styles.locationCard}>
        <Text style={styles.locationEmoji}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>
            {hasLocation ? `Delivering near ${label ?? 'you'}` : 'Set location for live stores'}
          </Text>
          <Text style={styles.locationSubtitle}>See only sellers that can deliver to your area.</Text>
        </View>
      </Pressable>

      {permissionDenied && (
        <Text style={styles.locationWarning}>
          Location access was denied — showing results for Delhi. Enable location for stores near you.
        </Text>
      )}

      {/* Shop by category */}
      {!!categories.length && (
        <View style={styles.section}>
          <SectionHeader title="Shop by category" onSeeAll={() => router.push('/search')} />
          <View style={styles.categoryGrid}>
            {categories.slice(0, 10).map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryTile}
                onPress={() => router.push({ pathname: '/search', params: { categoryId: cat.id } })}
              >
                <View style={styles.categoryIconWrap}>
                  {cat.imageUrl ? (
                    <Image source={{ uri: cat.imageUrl }} style={styles.categoryIconImage} />
                  ) : (
                    <Text style={styles.categoryIconLetter}>{cat.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.categoryTileText} numberOfLines={2}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {hasLocation ? (
        <>
          {/* Per-category product shelves */}
          {shelfCategories.map((cat) => (
            <ProductShelf key={cat.id} category={cat} lat={lat!} lng={lng!} pincode={pincode ?? undefined} />
          ))}

          {/* Nearby stores */}
          <StoreRail
            title="Nearby stores"
            subtitle="Delivering to your location"
            result={storesResult}
            onSeeAll={() => router.push('/search')}
          />

          {/* Popular stores */}
          <StoreRail
            title="Popular stores"
            subtitle="Most loved in your area"
            result={popularStoresResult}
            onSeeAll={() => router.push('/search')}
          />
        </>
      ) : (
        <Loader label="Finding stores near you…" />
      )}

      {/* Social proof */}
      <View style={styles.proofGrid}>
        {PROOF_POINTS.map((p) => (
          <View key={p.label} style={styles.proofCard}>
            <Text style={styles.proofEmoji}>{p.emoji}</Text>
            <Text style={styles.proofLabel}>{p.label}</Text>
          </View>
        ))}
      </View>

      {/* Commerce CTAs */}
      <View style={styles.ctaColumn}>
        {COMMERCE_CTAS.map((c) => (
          <View key={c.title} style={styles.ctaCard}>
            <Text style={styles.ctaEmoji}>{c.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>{c.title}</Text>
              <Text style={styles.ctaText}>{c.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Compare banner */}
      <Pressable style={styles.compareBanner} onPress={() => router.push('/search')}>
        <Text style={styles.compareEmoji}>📦</Text>
        <Text style={styles.compareTitle}>Compare prices across nearby stores</Text>
        <Text style={styles.compareSubtitle}>
          Search any product to instantly see which local store offers the best price.
        </Text>
        <View style={styles.compareButton}>
          <Text style={styles.compareButtonText}>Search products →</Text>
        </View>
      </Pressable>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={styles.sectionSeeAll}>View all</Text>
        </Pressable>
      )}
    </View>
  );
}

function StoreRail({
  title,
  subtitle,
  result,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  result: { data?: { stores: StoreCard[] }; isLoading: boolean };
  onSeeAll: () => void;
}) {
  const router = useRouter();
  const stores = result.data?.stores ?? [];
  if (!result.isLoading && stores.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      {result.isLoading ? (
        <Loader />
      ) : (
        <FlatList
          horizontal
          data={stores}
          keyExtractor={(s) => s.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railRow}
          renderItem={({ item }) => (
            <Pressable
              style={styles.storeRailCard}
              onPress={() => router.push({ pathname: '/store/[slug]', params: { slug: item.slug } })}
            >
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.storeRailImage} />
              ) : (
                <View style={[styles.storeRailImage, styles.imagePlaceholder]} />
              )}
              <Text style={styles.storeRailName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.storeRailMetaRow}>
                {item.ratingAvg > 0 && <Text style={styles.storeRailMeta}>★ {item.ratingAvg.toFixed(1)}</Text>}
                <Text style={styles.storeRailMeta}>{item.avgPrepTimeMins} min</Text>
              </View>
              <Text style={styles.storeRailDelivery}>
                {item.deliveryFee === 0 ? 'Free delivery' : `₹${item.deliveryFee} delivery`}
              </Text>
              {!item.isOpen && <Badge label="Closed" tone="warning" />}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function ProductShelf({
  category,
  lat,
  lng,
  pincode,
}: {
  category: CategoryItem;
  lat: number;
  lng: number;
  pincode?: string;
}) {
  const router = useRouter();
  const { data, isLoading } = useProductSearchQuery({ categoryId: category.id, lat, lng, pincode, limit: 10 });
  const products = data?.products ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={category.name}
        onSeeAll={() => router.push({ pathname: '/search', params: { categoryId: category.id } })}
      />
      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railRow}
          renderItem={({ item }) => (
            <Pressable
              style={styles.productRailCard}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id, store: item.store.slug } })}
            >
              {item.imageUrls[0] ? (
                <Image source={{ uri: item.imageUrls[0] }} style={styles.productRailImage} />
              ) : (
                <View style={[styles.productRailImage, styles.imagePlaceholder]} />
              )}
              <Text style={styles.productRailName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productRailStore} numberOfLines={1}>{item.store.name}</Text>
              <Text style={styles.productRailPrice}>₹{item.basePrice}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 20 },

  utilityRow: { flexDirection: 'row', gap: 8 },
  utilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  utilityButtonPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  utilityButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  utilityButtonTextPrimary: { fontSize: 13, fontWeight: '700', color: '#fff' },

  hero: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: COLORS.primary,
    gap: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 19 },
  heroStatsRow: { flexDirection: 'row', gap: 8 },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: 10, alignItems: 'center' },
  heroStatValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { flex: 1, color: '#94a3b8', fontSize: 14 },
  heroChipsRow: { gap: 8 },
  heroChip: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  heroChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationEmoji: { fontSize: 22 },
  locationTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  locationSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  locationWarning: { fontSize: 12, color: '#b45309', textAlign: 'center' },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  sectionSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionSeeAll: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryTile: { width: '22%', alignItems: 'center', gap: 6 },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconImage: { width: 56, height: 56, borderRadius: 18 },
  categoryIconLetter: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  categoryTileText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },

  railRow: { gap: 12 },
  storeRailCard: {
    width: 168,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  storeRailImage: { width: '100%', height: 84, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: '#e2e8f0' },
  storeRailName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  storeRailMetaRow: { flexDirection: 'row', gap: 8 },
  storeRailMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  storeRailDelivery: { fontSize: 11, color: COLORS.success, fontWeight: '700' },

  productRailCard: { width: 132, gap: 4 },
  productRailImage: { width: 132, height: 132, borderRadius: 14 },
  productRailName: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginTop: 4 },
  productRailStore: { fontSize: 11, color: COLORS.textMuted },
  productRailPrice: { fontSize: 13, fontWeight: '800', color: COLORS.primary },

  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  proofCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  proofEmoji: { fontSize: 18 },
  proofLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },

  ctaColumn: { gap: 10 },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    padding: 14,
  },
  ctaEmoji: { fontSize: 24 },
  ctaTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  ctaText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 17 },

  compareBanner: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: COLORS.secondary,
    gap: 6,
  },
  compareEmoji: { fontSize: 28, marginBottom: 4 },
  compareTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  compareSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
  compareButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compareButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
