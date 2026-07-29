import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEnsureLocation } from '@/hooks/use-location';
import { useLocationStore } from '@/store/location-store';
import { useCuisinesQuery, useFoodCartQuery, useRestaurantsQuery } from '@/hooks/use-food';
import { RestaurantCard } from '@/features/food/restaurant-card';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

/** Mirrors buyer-web's /food and /restaurants, which differ only in how many
 *  cards they show — one scrollable screen covers both on mobile. */
export function RestaurantsScreen() {
  const router = useRouter();
  useEnsureLocation();
  const { lat, lng, pincode, label, permissionDenied } = useLocationStore();
  const [cuisineSlug, setCuisineSlug] = useState<string | undefined>();

  const { data: cuisines = [] } = useCuisinesQuery();
  const { data: foodCart } = useFoodCartQuery();

  const hasLocation = lat != null && lng != null;
  const params = useMemo(
    () => ({
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      pincode: pincode ?? undefined,
      cuisine: cuisineSlug,
      page: 1,
      limit: 36,
    }),
    [lat, lng, pincode, cuisineSlug],
  );

  const {
    data: restaurants = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRestaurantsQuery(params, hasLocation);

  const topPicks = useMemo(() => restaurants.slice(0, 8), [restaurants]);
  const cartCount = foodCart?.itemCount ?? 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.content}
        onRefresh={hasLocation ? refetch : undefined}
        refreshing={hasLocation ? isRefetching : false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroEmoji}>🍽️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Food delivery</Text>
                <Text style={styles.heroSubtitle}>Restaurants, cloud kitchens & cafés near you</Text>
                {hasLocation && (
                  <Text style={styles.heroLocation}>📍 Delivering to {label ?? 'your location'}</Text>
                )}
              </View>
            </View>

            {permissionDenied && (
              <Text style={styles.warning}>
                Location access was denied — showing results for Delhi. Enable location for
                restaurants near you.
              </Text>
            )}

            {cuisines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cuisines</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  <Chip label="All" active={!cuisineSlug} onPress={() => setCuisineSlug(undefined)} />
                  {cuisines.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      active={cuisineSlug === c.slug}
                      onPress={() => setCuisineSlug(c.slug)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {topPicks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top picks</Text>
                <Text style={styles.sectionSubtitle}>Highly rated near you</Text>
                <FlatList
                  horizontal
                  data={topPicks}
                  keyExtractor={(r) => `top-${r.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.railRow}
                  renderItem={({ item }) => <RestaurantCard restaurant={item} variant="compact" />}
                />
              </View>
            )}

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>All restaurants</Text>
              <Text style={styles.sectionSubtitle}>
                {isLoading ? 'Loading…' : `${restaurants.length} available`}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !hasLocation ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>Set your location</Text>
              <Text style={styles.stateText}>
                Choose a delivery location to discover restaurants that deliver to you.
              </Text>
            </View>
          ) : isLoading ? (
            <Loader label="Finding restaurants near you…" />
          ) : isError ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>Could not load restaurants</Text>
              <Text style={styles.stateText}>
                {error instanceof Error ? error.message : 'Failed to load restaurants'}
              </Text>
              <Button label="Retry" variant="secondary" onPress={() => refetch()} />
            </View>
          ) : (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>No restaurants found</Text>
              <Text style={styles.stateText}>
                No food stores deliver to this location yet. Try another cuisine, or check back as we
                expand coverage in your area.
              </Text>
              <Button label="Browse grocery" variant="secondary" onPress={() => router.push('/home')} />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <RestaurantCard restaurant={item} />
          </View>
        )}
      />

      {cartCount > 0 && foodCart && (
        <Pressable style={styles.floatingCart} onPress={() => router.push('/food-cart')}>
          <Text style={styles.floatingCartText}>
            {cartCount} item{cartCount !== 1 ? 's' : ''} · ₹{foodCart.totals.grandTotal.toFixed(0)}
          </Text>
          <View style={styles.floatingCartPill}>
            <Text style={styles.floatingCartPillText}>View cart</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 96, gap: 12 },
  headerBlock: { gap: 18, marginBottom: 4 },

  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 20 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  heroSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  heroLocation: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  warning: { fontSize: 12, color: '#b45309' },

  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  sectionSubtitle: { fontSize: 12, color: COLORS.textMuted },
  chipRow: { gap: 8, paddingVertical: 2 },
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
  railRow: { gap: 12, paddingVertical: 2 },

  listHeader: { gap: 2 },
  cardWrap: { marginBottom: 12 },

  stateBlock: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  stateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
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
