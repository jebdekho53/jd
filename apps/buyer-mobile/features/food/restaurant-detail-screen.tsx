import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAddFoodCartItemMutation,
  useClearFoodCartMutation,
  useFoodCartQuery,
  useRestaurantMenuQuery,
  useRestaurantQuery,
} from '@/hooks/use-food';
import { MenuItemSheet } from '@/features/food/menu-item-sheet';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { BuyerApiError } from '@/services/buyer-api';
import type { AddFoodCartItemPayload, MenuCategory, MenuItem } from '@/types/food';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  danger: '#dc2626',
};

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function defaultVariantOf(item: MenuItem) {
  return item.variants.find((v) => v.isDefault) ?? item.variants[0];
}

function displayPrice(item: MenuItem): number {
  const variant = defaultVariantOf(item);
  return variant ? toNumber(variant.price) : toNumber(item.basePrice);
}

/** Items with a choice to make (multiple sizes or any addon group) open the
 *  customisation sheet; everything else adds straight to the cart. */
function needsCustomisation(item: MenuItem): boolean {
  return item.variants.length > 1 || item.addonGroups.length > 0;
}

export function RestaurantDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: restaurant, isLoading, isError, error, refetch } = useRestaurantQuery(slug);
  const { data: menu, isLoading: menuLoading } = useRestaurantMenuQuery(slug);
  const { data: foodCart } = useFoodCartQuery();
  const addItem = useAddFoodCartItemMutation();
  const clearCart = useClearFoodCartMutation();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const listRef = useRef<SectionList<MenuItem, MenuCategory>>(null);

  const categories = useMemo(() => menu?.categories ?? [], [menu]);
  const sections = useMemo(
    () => categories.map((cat) => ({ ...cat, data: cat.items })),
    [categories],
  );

  const visibleCategoryId = activeCategoryId ?? categories[0]?.id ?? null;
  const cartIsThisRestaurant = foodCart?.store.slug === slug;
  const cartCount = cartIsThisRestaurant ? foodCart.itemCount : 0;
  const cartTotal = cartIsThisRestaurant ? foodCart.totals.grandTotal : 0;

  const jumpToCategory = useCallback(
    (categoryId: string) => {
      setActiveCategoryId(categoryId);
      const index = sections.findIndex((s) => s.id === categoryId);
      if (index >= 0) {
        listRef.current?.scrollToLocation({ sectionIndex: index, itemIndex: 0, viewPosition: 0 });
      }
    },
    [sections],
  );

  /** The food cart holds one restaurant at a time; the API rejects a
   *  cross-restaurant add with FOOD_CART_STORE_CONFLICT. Offer to start over. */
  const handleStoreConflict = useCallback(
    (payload: AddFoodCartItemPayload) => {
      Alert.alert(
        'Start a new food cart?',
        `Your food cart has items from ${foodCart?.store.name ?? 'another restaurant'}. Adding this dish will clear it.`,
        [
          { text: 'Keep existing', style: 'cancel' },
          {
            text: 'Clear & add',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearCart.mutateAsync();
                await addItem.mutateAsync(payload);
                setSheetItem(null);
              } catch (e) {
                setSheetError((e as Error).message);
              }
            },
          },
        ],
      );
    },
    [foodCart?.store.name, clearCart, addItem],
  );

  const addToCart = useCallback(
    async (payload: AddFoodCartItemPayload) => {
      setSheetError(null);
      try {
        await addItem.mutateAsync(payload);
        setSheetItem(null);
      } catch (e) {
        if (e instanceof BuyerApiError && e.code === 'FOOD_CART_STORE_CONFLICT') {
          handleStoreConflict(payload);
          return;
        }
        const message = (e as Error).message;
        if (sheetItem) setSheetError(message);
        else Alert.alert('Could not add item', message);
      }
    },
    [addItem, handleStoreConflict, sheetItem],
  );

  const handleAddPress = useCallback(
    (item: MenuItem) => {
      if (needsCustomisation(item)) {
        setSheetError(null);
        setSheetItem(item);
        return;
      }
      void addToCart({
        menuItemId: item.id,
        variantId: defaultVariantOf(item)?.id,
        quantity: 1,
      });
    },
    [addToCart],
  );

  if (isError) {
    return (
      <View style={styles.stateBlock}>
        <Text style={styles.stateTitle}>Restaurant not found</Text>
        <Text style={styles.stateText}>
          {error instanceof Error ? error.message : 'This restaurant is unavailable.'}
        </Text>
        <Button label="Retry" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  if (isLoading || !restaurant) return <Loader fullScreen />;

  const cuisineNames = restaurant.cuisines.map((c) => c.name).join(' · ');
  const address = [restaurant.line1, restaurant.locality, restaurant.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.bannerWrap}>
              {restaurant.bannerUrl ? (
                <Image source={{ uri: restaurant.bannerUrl }} style={styles.banner} />
              ) : (
                <View style={[styles.banner, styles.placeholder]}>
                  <Text style={styles.placeholderEmoji}>🍽️</Text>
                </View>
              )}
              <View style={styles.bannerOverlay}>
                {restaurant.logoUrl && (
                  <Image source={{ uri: restaurant.logoUrl }} style={styles.logo} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{restaurant.name}</Text>
                  {!!cuisineNames && <Text style={styles.cuisines}>{cuisineNames}</Text>}
                </View>
              </View>
            </View>

            <View style={styles.statGrid}>
              <Stat label="Rating" value={`★ ${restaurant.ratingAvg.toFixed(1)} (${restaurant.ratingCount})`} />
              <Stat label="Delivery ETA" value={`${restaurant.avgPrepTimeMins} min`} />
              <Stat label="Min order" value={`₹${restaurant.minOrderAmount}`} />
              {restaurant.costForTwo != null && (
                <Stat label="Cost for two" value={`₹${restaurant.costForTwo}`} />
              )}
            </View>

            {restaurant.description ? (
              <Text style={styles.description}>{restaurant.description}</Text>
            ) : null}
            {!!address && <Text style={styles.address}>📍 {address}</Text>}

            <View style={styles.offersCard}>
              <Text style={styles.offersTitle}>🏷️ Offers & deals</Text>
              <Text style={styles.offersText}>
                Restaurant promotions and bank offers appear here at checkout. No offer applied yet.
              </Text>
            </View>

            <View style={styles.menuHeader}>
              <Text style={styles.sectionHeading}>Menu</Text>
              <Text style={styles.sectionSubheading}>Add items to your food cart</Text>
            </View>

            {menuLoading ? (
              <Loader />
            ) : categories.length === 0 ? (
              <Text style={styles.stateText}>Menu is not available right now.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, visibleCategoryId === cat.id && styles.chipActive]}
                    onPress={() => jumpToCategory(cat.id)}
                  >
                    <Text
                      style={[styles.chipText, visibleCategoryId === cat.id && styles.chipTextActive]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>{section.name}</Text>
            {section.description ? (
              <Text style={styles.categoryDescription}>{section.description}</Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <MenuItemRow item={item} onAdd={() => handleAddPress(item)} adding={addItem.isPending} />
        )}
        ListFooterComponent={
          restaurant.reviews.length > 0 ? (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionHeading}>Reviews</Text>
              <Text style={styles.sectionSubheading}>{restaurant.ratingCount} ratings</Text>
              {restaurant.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <View style={styles.reviewRating}>
                      <Text style={styles.reviewRatingText}>★ {review.rating}</Text>
                    </View>
                    {review.buyerName ? (
                      <Text style={styles.reviewAuthor}>{review.buyerName}</Text>
                    ) : null}
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null
        }
      />

      {cartCount > 0 && (
        <Pressable style={styles.floatingCart} onPress={() => router.push('/food-cart')}>
          <Text style={styles.floatingCartText}>
            {cartCount} item{cartCount !== 1 ? 's' : ''} · ₹{cartTotal.toFixed(0)}
          </Text>
          <View style={styles.floatingCartPill}>
            <Text style={styles.floatingCartPillText}>View cart</Text>
          </View>
        </Pressable>
      )}

      <MenuItemSheet
        item={sheetItem}
        visible={!!sheetItem}
        submitting={addItem.isPending || clearCart.isPending}
        error={sheetError}
        onSubmit={addToCart}
        onClose={() => {
          setSheetItem(null);
          setSheetError(null);
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function DietDot({ dietType }: { dietType: string }) {
  const color = dietType === 'VEG' ? '#16a34a' : dietType === 'EGG' ? '#f59e0b' : '#dc2626';
  return (
    <View style={[styles.dietBox, { borderColor: color }]}>
      <View style={[styles.dietDot, { backgroundColor: color }]} />
    </View>
  );
}

function MenuItemRow({
  item,
  onAdd,
  adding,
}: {
  item: MenuItem;
  onAdd: () => void;
  adding: boolean;
}) {
  const unavailable = item.availability !== 'AVAILABLE';
  const image = item.imageUrls?.[0];
  const variant = defaultVariantOf(item);

  return (
    <View style={styles.menuRow}>
      <View style={styles.menuRowInfo}>
        <View style={styles.menuRowTitleRow}>
          <DietDot dietType={item.dietType} />
          <Text style={styles.menuItemName}>{item.name}</Text>
        </View>
        {item.description ? (
          <Text style={styles.menuItemDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {item.servingSize ? <Text style={styles.menuItemMeta}>{item.servingSize}</Text> : null}
        {variant && item.variants.length > 1 ? (
          <Text style={styles.menuItemMeta}>{variant.name}</Text>
        ) : null}
        <Text style={styles.menuItemPrice}>₹{displayPrice(item).toFixed(0)}</Text>
      </View>

      <View style={styles.menuRowAside}>
        {image ? (
          <Image source={{ uri: image }} style={styles.menuItemImage} />
        ) : (
          <View style={[styles.menuItemImage, styles.placeholder]} />
        )}
        <Pressable
          style={[styles.addButton, unavailable && styles.addButtonDisabled]}
          disabled={unavailable || adding}
          onPress={onAdd}
        >
          <Text style={styles.addButtonText}>{needsCustomisation(item) ? 'ADD +' : 'ADD'}</Text>
        </Pressable>
        {unavailable && <Text style={styles.unavailable}>Unavailable</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 96 },
  headerBlock: { gap: 14, paddingBottom: 8 },

  bannerWrap: { position: 'relative' },
  banner: { width: '100%', height: 180 },
  placeholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 44 },
  bannerOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  logo: { width: 52, height: 52, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 6,
  },
  cuisines: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 6,
  },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  stat: { flexGrow: 1, minWidth: '46%', backgroundColor: COLORS.cream, borderRadius: 12, padding: 10 },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.4 },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 3 },

  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, paddingHorizontal: 16 },
  address: { fontSize: 12, color: COLORS.textMuted, paddingHorizontal: 16 },

  offersCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#f59e0b66',
    backgroundColor: '#fffbeb',
    padding: 14,
    gap: 4,
  },
  offersTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  offersText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  menuHeader: { paddingHorizontal: 16, gap: 2, marginTop: 4 },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  sectionSubheading: { fontSize: 12, color: COLORS.textMuted },

  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },

  categoryHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6, gap: 2 },
  categoryName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  categoryDescription: { fontSize: 12, color: COLORS.textMuted },

  menuRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuRowInfo: { flex: 1, gap: 4 },
  menuRowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dietBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietDot: { width: 8, height: 8, borderRadius: 999 },
  menuItemName: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  menuItemDescription: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  menuItemMeta: { fontSize: 11, color: COLORS.textMuted },
  menuItemPrice: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },

  menuRowAside: { alignItems: 'center', gap: 6, width: 84 },
  menuItemImage: { width: 84, height: 84, borderRadius: 12 },
  addButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  unavailable: { fontSize: 10, color: COLORS.danger },

  reviewsSection: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 6,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewRating: { backgroundColor: COLORS.cream, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  reviewRatingText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  reviewAuthor: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  stateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  stateText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 },

  floatingCart: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  floatingCartText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  floatingCartPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  floatingCartPillText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
