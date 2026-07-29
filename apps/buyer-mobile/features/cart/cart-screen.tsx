import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/hooks/use-cart';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { GuestCartView } from '@/features/cart/guest-cart-view';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import type { CartItem } from '@/types/cart';

export function CartScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { data: cart, isLoading } = useCartQuery();
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();

  if (!isAuthenticated) return <GuestCartView />;

  if (isLoading) return <Loader fullScreen />;

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Button label="Browse stores" onPress={() => router.replace('/home')} />
      </View>
    );
  }

  const belowMin = cart.totals.subtotal < cart.store.minOrderAmount;

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: CartItem }) => (
          <View style={styles.row}>
            {item.product.imageUrls[0] ? (
              <Image source={{ uri: item.product.imageUrls[0] }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.variant}>{item.variant.name}</Text>
              <Text style={styles.price}>₹{item.unitPrice} × {item.quantity} = ₹{item.lineTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.qtyControls}>
              <Pressable
                style={styles.qtyButton}
                onPress={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Pressable
                style={styles.qtyButton}
                onPress={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                disabled={item.quantity >= item.availableQty}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => removeItem.mutate(item.id)} style={styles.removeButton}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <SummaryRow label="Subtotal" value={cart.totals.subtotal} />
            {cart.totals.discount > 0 && <SummaryRow label="Savings" value={-cart.totals.discount} tone="success" />}
            <SummaryRow
              label="Delivery"
              value={cart.totals.deliveryFee}
              free={cart.totals.deliveryFee === 0}
            />
            {cart.totals.tax > 0 && <SummaryRow label="Taxes" value={cart.totals.tax} />}
            <View style={styles.divider} />
            <SummaryRow label="To pay" value={cart.totals.grandTotal} bold />
          </View>
        }
      />
      <View style={styles.footer}>
        {belowMin && (
          <Text style={styles.minWarning}>
            Add ₹{(cart.store.minOrderAmount - cart.totals.subtotal).toFixed(0)} more to reach the ₹{cart.store.minOrderAmount} minimum order
          </Text>
        )}
        <Button
          label={`Proceed to checkout · ₹${cart.totals.grandTotal.toFixed(0)}`}
          onPress={() => router.push('/checkout')}
          disabled={belowMin}
        />
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  tone,
  free,
  bold,
}: {
  label: string;
  value: number;
  tone?: 'success';
  free?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.summaryBold,
          tone === 'success' && styles.summarySuccess,
        ]}
      >
        {free ? 'Free' : `₹${Math.abs(value).toFixed(2)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, gap: 12 },
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
  summaryValue: { fontSize: 14, color: '#0f172a' },
  summarySuccess: { color: '#065f46' },
  summaryBold: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  minWarning: { fontSize: 13, color: '#b45309', textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyTitle: { fontSize: 16, color: '#64748b' },
});
