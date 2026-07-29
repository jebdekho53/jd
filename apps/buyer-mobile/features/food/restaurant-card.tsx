import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/badge';
import type { RestaurantSummary } from '@/types/food';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
};

/** `compact` is the horizontal-rail variant (fixed width); `default` is the
 *  full-width card used in the vertical listing. */
export function RestaurantCard({
  restaurant,
  variant = 'default',
}: {
  restaurant: RestaurantSummary;
  variant?: 'default' | 'compact';
}) {
  const router = useRouter();
  const cuisineLabel = restaurant.cuisines.slice(0, 2).map((c) => c.name).join(' · ');
  const open = () =>
    router.push({ pathname: '/restaurant/[slug]', params: { slug: restaurant.slug } });

  if (variant === 'compact') {
    return (
      <Pressable style={styles.compactCard} onPress={open}>
        <View>
          {restaurant.bannerUrl ? (
            <Image source={{ uri: restaurant.bannerUrl }} style={styles.compactBanner} />
          ) : (
            <View style={[styles.compactBanner, styles.placeholder]}>
              <Text style={styles.placeholderLetter}>{restaurant.name.charAt(0)}</Text>
            </View>
          )}
          {restaurant.isCloudKitchen && (
            <View style={styles.cloudKitchenBadge}>
              <Badge label="Cloud kitchen" tone="info" />
            </View>
          )}
        </View>
        <View style={styles.compactBody}>
          <Text style={styles.compactName} numberOfLines={1}>{restaurant.name}</Text>
          {!!cuisineLabel && (
            <Text style={styles.compactCuisines} numberOfLines={1}>{cuisineLabel}</Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaStrong}>★ {restaurant.ratingAvg.toFixed(1)}</Text>
            <Text style={styles.meta}>{restaurant.avgPrepTimeMins} min</Text>
          </View>
          {restaurant.costForTwo != null && (
            <Text style={styles.meta}>₹{restaurant.costForTwo} for two</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={open}>
      <View>
        {restaurant.bannerUrl ? (
          <Image source={{ uri: restaurant.bannerUrl }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, styles.placeholder]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
        <View style={styles.etaPill}>
          <Text style={styles.etaText}>{restaurant.avgPrepTimeMins} min</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          {restaurant.logoUrl ? (
            <Image source={{ uri: restaurant.logoUrl }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.placeholder]}>
              <Text style={styles.placeholderLetter}>{restaurant.name.charAt(0)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
            {!!cuisineLabel && (
              <Text style={styles.cuisines} numberOfLines={1}>{cuisineLabel}</Text>
            )}
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaStrong}>
            ★ {restaurant.ratingAvg.toFixed(1)} ({restaurant.ratingCount})
          </Text>
          {restaurant.costForTwo != null && (
            <Text style={styles.meta}>₹{restaurant.costForTwo} for two</Text>
          )}
          {restaurant.distanceKm != null && (
            <Text style={styles.meta}>{restaurant.distanceKm} km</Text>
          )}
        </View>

        {restaurant.cuisines.length > 0 && (
          <View style={styles.tagRow}>
            {restaurant.cuisines.slice(0, 3).map((c) => (
              <View key={c.id} style={styles.tag}>
                <Text style={styles.tagText}>{c.name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>View menu</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  banner: { width: '100%', height: 144 },
  placeholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 34 },
  placeholderLetter: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  etaPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  etaText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  body: { padding: 14, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  cuisines: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaStrong: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textMuted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: COLORS.cream, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  cta: {
    marginTop: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  compactCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  compactBanner: { width: '100%', height: 104 },
  cloudKitchenBadge: { position: 'absolute', left: 8, top: 8 },
  compactBody: { padding: 10, gap: 3 },
  compactName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  compactCuisines: { fontSize: 11, color: COLORS.textMuted },
});
