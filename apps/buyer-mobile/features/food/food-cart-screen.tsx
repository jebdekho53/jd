import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useClearFoodCartMutation,
  useFoodCartQuery,
  useRemoveFoodCartItemMutation,
  useUpdateFoodCartItemMutation,
} from '@/hooks/use-food';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  danger: '#dc2626',
};

export function FoodCartScreen() {
  const router = useRouter();
  const { data: cart, isLoading, isFetching } = useFoodCartQuery();
  const updateItem = useUpdateFoodCartItemMutation();
  const removeItem = useRemoveFoodCartItemMutation();
  const clearCart = useClearFoodCartMutation();

  const bootstrapping = (isLoading || isFetching) && !cart;
  const hasItems = !!cart && cart.items.length > 0;
  const meetsMin = cart ? cart.totals.subtotal >= cart.store.minOrderAmount : false;

  const handleClear = () => {
    Alert.alert('Clear your food cart?', 'This removes every dish from this restaurant.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => clearCart.mutate() },
    ]);
  };

  if (bootstrapping) return <Loader fullScreen />;

  if (!hasItems) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
        </View>
        <Text style={styles.emptyTitle}>Your food cart is empty</Text>
        <Text style={styles.emptyText}>Browse restaurants and add dishes to order.</Text>
        <Button label="Explore food" onPress={() => router.replace('/restaurants')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🍽️ Food cart</Text>
            <Text style={styles.subtitle}>
              {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} from {cart.store.name}
            </Text>
          </View>
          <Pressable onPress={handleClear} disabled={clearCart.isPending}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>

        <Card style={styles.itemsCard}>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/restaurant/[slug]', params: { slug: cart.store.slug } })
            }
          >
            <Text style={styles.storeName}>{cart.store.name}</Text>
          </Pressable>

          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.menuItem.imageUrls?.[0] ? (
                <Image source={{ uri: item.menuItem.imageUrls[0] }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.placeholder]}>
                  <Text style={styles.placeholderLetter}>{item.menuItem.name.charAt(0)}</Text>
                </View>
              )}

              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItem.name}</Text>
                {item.variantName ? <Text style={styles.itemMeta}>{item.variantName}</Text> : null}
                {item.addons.length > 0 && (
                  <Text style={styles.itemMeta}>+ {item.addons.map((a) => a.name).join(', ')}</Text>
                )}
                {item.specialInstructions ? (
                  <Text style={styles.itemNote}>“{item.specialInstructions}”</Text>
                ) : null}
                <Text style={styles.itemPrice}>₹{item.lineTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => {
                    const next = item.quantity - 1;
                    if (next <= 0) removeItem.mutate(item.id);
                    else updateItem.mutate({ itemId: item.id, quantity: next });
                  }}
                >
                  <Text style={styles.stepperText}>−</Text>
                </Pressable>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                >
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>

        <Card style={styles.billCard}>
          <Text style={styles.billTitle}>Bill details</Text>
          <Row label="Item total" value={`₹${cart.totals.subtotal.toFixed(2)}`} />
          <Row label="Packaging" value={`₹${cart.totals.packagingFee.toFixed(2)}`} />
          <Row label="Delivery fee" value={`₹${cart.totals.deliveryFee.toFixed(2)}`} />
          <Row label="Taxes" value={`₹${cart.totals.tax.toFixed(2)}`} />
          <View style={styles.divider} />
          <Row label="Grand total" value={`₹${cart.totals.grandTotal.toFixed(2)}`} bold />
          {!meetsMin && (
            <Text style={styles.minOrderWarning}>
              Minimum order is ₹{cart.store.minOrderAmount}. Add more items to checkout.
            </Text>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={`Proceed to checkout · ₹${cart.totals.grandTotal.toFixed(0)}`}
          disabled={!meetsMin}
          onPress={() => router.push('/food-checkout')}
        />
      </View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  clearText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },

  itemsCard: { padding: 0, overflow: 'hidden' },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemImage: { width: 56, height: 56, borderRadius: 12 },
  placeholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  placeholderLetter: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  itemMeta: { fontSize: 11, color: COLORS.textMuted },
  itemNote: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
  },
  stepperButton: { paddingHorizontal: 10, paddingVertical: 6 },
  stepperText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  quantity: { minWidth: 22, textAlign: 'center', fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  billCard: { gap: 8 },
  billTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: COLORS.textMuted },
  rowValue: { fontSize: 13, color: COLORS.textPrimary },
  rowBold: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },
  minOrderWarning: { fontSize: 12, color: COLORS.danger, marginTop: 4 },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
