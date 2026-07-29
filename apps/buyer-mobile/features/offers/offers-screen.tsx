import type { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useFlashSalesQuery,
  useFreeDeliveryDealsQuery,
  useOffersNearYouQuery,
  useTopDealsQuery,
  useTrendingDealsQuery,
} from '@/hooks/use-offers';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import type { FlashSaleOffer, FreeDeliveryDeal, StorePromotionDeal } from '@/types/offers';

export function OffersScreen() {
  const router = useRouter();
  const flashSales = useFlashSalesQuery();
  const topDeals = useTopDealsQuery();
  const trending = useTrendingDealsQuery();
  const freeDelivery = useFreeDeliveryDealsQuery();
  const nearYou = useOffersNearYouQuery();

  const loading = flashSales.isLoading && topDeals.isLoading;
  const hasAnything =
    (flashSales.data?.length ?? 0) +
      (topDeals.data?.length ?? 0) +
      (trending.data?.length ?? 0) +
      (freeDelivery.data?.length ?? 0) +
      (nearYou.data?.length ?? 0) >
    0;

  if (loading) return <Loader fullScreen />;

  if (!hasAnything) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No active offers right now</Text>
        <Text style={styles.emptyDescription}>Check back soon — new deals are added regularly.</Text>
      </View>
    );
  }

  const goToStore = (slug?: string) => {
    if (!slug) return;
    router.push({ pathname: '/store/[slug]', params: { slug } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!!flashSales.data?.length && (
        <Section title="Flash sales">
          {flashSales.data.map((offer) => (
            <FlashSaleCard key={offer.id} offer={offer} onPress={() => goToStore(offer.store?.slug)} />
          ))}
        </Section>
      )}

      {!!nearYou.data?.length && (
        <Section title="Offers near you">
          {nearYou.data.map((offer) => (
            <FlashSaleCard key={offer.id} offer={offer} onPress={() => goToStore(offer.store?.slug)} />
          ))}
        </Section>
      )}

      {!!topDeals.data?.length && (
        <Section title="Top deals">
          {topDeals.data.map((deal) => (
            <DealCard key={deal.id} deal={deal} onPress={() => goToStore(deal.store.slug)} />
          ))}
        </Section>
      )}

      {!!trending.data?.length && (
        <Section title="Trending offers">
          {trending.data.map((deal) => (
            <DealCard key={deal.id} deal={deal} onPress={() => goToStore(deal.store.slug)} />
          ))}
        </Section>
      )}

      {!!freeDelivery.data?.length && (
        <Section title="Free delivery">
          {freeDelivery.data.map((row) => (
            <Pressable
              key={row.promotion.id}
              style={styles.card}
              onPress={() => goToStore(row.store.slug)}
            >
              <View style={styles.cardHeaderRow}>
                {row.store.logoUrl ? (
                  <Image source={{ uri: row.store.logoUrl }} style={styles.storeLogo} />
                ) : (
                  <View style={[styles.storeLogo, styles.storeLogoPlaceholder]} />
                )}
                <Text style={styles.storeName} numberOfLines={1}>{row.store.name}</Text>
                <Badge label="Free delivery" tone="success" />
              </View>
              {row.store.ratingAvg != null && (
                <Text style={styles.metaText}>★ {row.store.ratingAvg.toFixed(1)}</Text>
              )}
            </Pressable>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function FlashSaleCard({ offer, onPress }: { offer: FlashSaleOffer; onPress: () => void }) {
  const expiresIn = timeRemaining(offer.expiresAt);
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!offer.store}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.offerName} numberOfLines={1}>{offer.name}</Text>
        <Badge label={offer.badge} tone="warning" />
      </View>
      {offer.description && (
        <Text style={styles.offerDescription} numberOfLines={2}>{offer.description}</Text>
      )}
      <View style={styles.cardFooterRow}>
        {offer.store && <Text style={styles.storeNameSmall} numberOfLines={1}>{offer.store.name}</Text>}
        {expiresIn && <Text style={styles.metaText}>Ends {expiresIn}</Text>}
      </View>
      {offer.flashQtyRemaining != null && (
        <Text style={styles.stockText}>Only {offer.flashQtyRemaining} left</Text>
      )}
    </Pressable>
  );
}

function DealCard({ deal, onPress }: { deal: StorePromotionDeal; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.offerName} numberOfLines={1}>{deal.name}</Text>
        <Badge label={deal.badge} tone="warning" />
      </View>
      {deal.description && (
        <Text style={styles.offerDescription} numberOfLines={2}>{deal.description}</Text>
      )}
      <Text style={styles.storeNameSmall} numberOfLines={1}>{deal.store.name}</Text>
    </Pressable>
  );
}

function timeRemaining(iso: string): string | null {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(1, Math.floor(diffMs / 60_000))}m`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 20 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  emptyDescription: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  sectionBody: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  offerDescription: { fontSize: 12, color: '#64748b' },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeNameSmall: { fontSize: 12, color: '#2E5E4E', fontWeight: '600' },
  metaText: { fontSize: 11, color: '#94a3b8' },
  stockText: { fontSize: 11, color: '#b45309', fontWeight: '600' },
  storeLogo: { width: 32, height: 32, borderRadius: 8 },
  storeLogoPlaceholder: { backgroundColor: '#e2e8f0' },
  storeName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0f172a' },
});
