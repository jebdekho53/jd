import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useGuestCartStore } from '@/store/guest-cart-store';
import { Button } from '@/components/ui/button';

/** Cart view for signed-out users. No delivery fee/tax/promo computation —
 *  only the server cart can price those; this shows a subtotal and prompts
 *  sign-in before checkout, where the guest lines get merged into the real
 *  server cart (see useMergeGuestCartOnLogin in hooks/use-auth.ts). */
export function GuestCartView() {
  const router = useRouter();
  const { items, storeName, setQuantity, removeItem } = useGuestCartStore();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Button label="Browse stores" onPress={() => router.replace('/home')} />
      </View>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.variantId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          storeName ? <Text style={styles.storeLabel}>Items from {storeName}</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.productName}</Text>
              {item.variantName && <Text style={styles.variant}>{item.variantName}</Text>}
              <Text style={styles.price}>
                ₹{item.unitPrice} × {item.quantity} = ₹{(item.unitPrice * item.quantity).toFixed(2)}
              </Text>
            </View>
            <View style={styles.qtyControls}>
              <Pressable
                style={styles.qtyButton}
                onPress={() => setQuantity(item.variantId, item.quantity - 1)}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Pressable
                style={styles.qtyButton}
                onPress={() => setQuantity(item.variantId, item.quantity + 1)}
                disabled={item.quantity >= item.availableQty}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => removeItem(item.variantId)} style={styles.removeButton}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <Text style={styles.summaryHint}>
              Sign in to see delivery fee, taxes and complete checkout.
            </Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <Button label="Sign in to checkout" onPress={() => router.push('/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, gap: 12 },
  storeLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  image: { width: 48, height: 48, borderRadius: 10 },
  imagePlaceholder: { backgroundColor: '#e2e8f0' },
  info: { flex: 1, minWidth: 140 },
  name: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  variant: { fontSize: 12, color: '#64748b', marginTop: 2 },
  price: { fontSize: 13, color: '#334155', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  qty: { fontSize: 14, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  removeButton: { paddingHorizontal: 4 },
  removeText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: '#475569' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  summaryHint: { fontSize: 12, color: '#94a3b8' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyTitle: { fontSize: 16, color: '#64748b' },
});
