import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCompareQuery } from '@/hooks/use-buyer-queries';
import { useLocationStore } from '@/store/location-store';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import type { CompareStoreOffer } from '@/types/compare';

export function CompareScreen({ productId }: { productId: string }) {
  const router = useRouter();
  const { lat, lng, pincode } = useLocationStore();
  const { data, isLoading } = useCompareQuery(productId, lat ?? undefined, lng ?? undefined, pincode ?? undefined);

  if (isLoading) return <Loader fullScreen />;

  if (!data || data.stores.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No price comparison for this item</Text>
        <Text style={styles.emptyDescription}>
          Comparison works across grocery stores near you. We could not find this item at another
          store.
        </Text>
      </View>
    );
  }

  const rows = [...data.stores].sort((a, b) => a.finalPayableAmount - b.finalPayableAmount);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {data.imageUrl ? (
          <Image source={{ uri: data.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={2}>{data.name}</Text>
          <Text style={styles.unit}>{data.unit}</Text>
        </View>
      </View>

      {data.savings > 0 && (
        <View style={styles.savingsCard}>
          <Text style={styles.savingsHeadline}>
            Save up to ₹{data.savings.toFixed(0)} ({data.savingsPercent}%)
          </Text>
          <Text style={styles.savingsSub}>
            Best price ₹{data.bestPrice.toFixed(0)} across {rows.length} store{rows.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {rows.map((row) => (
        <StoreOfferCard
          key={row.storeId}
          row={row}
          onPress={() => router.push({ pathname: '/store/[slug]', params: { slug: row.storeSlug } })}
        />
      ))}
    </ScrollView>
  );
}

function StoreOfferCard({ row, onPress }: { row: CompareStoreOffer; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.card, row.cheapest && styles.cardCheapest]}
      onPress={onPress}
      disabled={!row.serviceable}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.storeName} numberOfLines={1}>{row.storeName}</Text>
        {row.cheapest && <Badge label="Cheapest" tone="success" />}
        {!row.serviceable && <Badge label="Not deliverable" tone="danger" />}
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{(row.offerPrice || row.price).toFixed(0)}</Text>
        {row.mrp != null && row.mrp > row.price && (
          <Text style={styles.mrp}>₹{row.mrp.toFixed(0)}</Text>
        )}
        {row.discountPercent > 0 && <Badge label={`${row.discountPercent}% off`} tone="danger" />}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Delivery {row.deliveryFee > 0 ? `₹${row.deliveryFee.toFixed(0)}` : 'Free'}
        </Text>
        {row.distanceKm != null && (
          <Text style={styles.metaText}>{row.distanceKm.toFixed(1)} km away</Text>
        )}
        {row.etaMins != null && <Text style={styles.metaText}>{row.etaMins} min</Text>}
        {row.stock <= 0 && <Text style={styles.metaTextDanger}>Out of stock</Text>}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total payable</Text>
        <Text style={styles.totalValue}>₹{row.finalPayableAmount.toFixed(0)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  emptyDescription: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  image: { width: 64, height: 64, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: '#e2e8f0' },
  headerInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  unit: { fontSize: 12, color: '#64748b', marginTop: 2 },
  savingsCard: {
    backgroundColor: '#ecf5f1',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  savingsHeadline: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  savingsSub: { fontSize: 12, color: '#64748b' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardCheapest: { borderColor: '#16A34A', borderWidth: 1.5 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  mrp: { fontSize: 13, color: '#94a3b8', textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: { fontSize: 12, color: '#64748b' },
  metaTextDanger: { fontSize: 12, color: '#dc2626' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  totalLabel: { fontSize: 12, color: '#64748b' },
  totalValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
});
