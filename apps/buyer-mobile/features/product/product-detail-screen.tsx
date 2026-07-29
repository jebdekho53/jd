import { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProductQuery } from '@/hooks/use-buyer-queries';
import { useAddCartItemMutation, useCartQuery } from '@/hooks/use-cart';
import { useIsWishlisted, useToggleWishlistMutation } from '@/hooks/use-wishlist';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { useGuestCartStore, StoreConflictError } from '@/store/guest-cart-store';
import { ProductReviewsSection } from '@/features/product/product-reviews-section';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';

export function ProductDetailScreen({ productId, storeSlug }: { productId: string; storeSlug?: string }) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { data: product, isLoading } = useProductQuery(productId, storeSlug);
  const { data: cart } = useCartQuery();
  const addItem = useAddCartItemMutation();
  const wishlisted = useIsWishlisted(productId);
  const toggleWishlist = useToggleWishlistMutation();
  const guestCart = useGuestCartStore();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Loader fullScreen />;
  if (!product) return <Text style={styles.empty}>Product not found</Text>;

  const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const inDifferentStoreCart = isAuthenticated
    ? cart && cart.storeId !== product.store.id
    : guestCart.storeId && guestCart.storeId !== product.store.id;

  const handleAdd = async () => {
    if (!variant) return;
    setError(null);

    if (!isAuthenticated) {
      try {
        guestCart.addItem({
          productId: product.id,
          variantId: variant.id,
          storeId: product.store.id,
          storeName: product.store.name,
          productName: product.name,
          variantName: variant.name ?? null,
          unitPrice: variant.price,
          imageUrl: product.imageUrls[0] ?? null,
          availableQty: variant.availableQty,
        });
      } catch (e) {
        if (e instanceof StoreConflictError) {
          setError(`Your cart has items from ${e.currentStoreName}. Clear it first to add from a new store.`);
          return;
        }
        setError((e as Error).message);
      }
      return;
    }

    try {
      await addItem.mutateAsync({ productId: product.id, variantId: variant.id, quantity: 1 });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    toggleWishlist.mutate({ productId, wishlisted });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        {product.imageUrls[0] ? (
          <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <Pressable
          style={styles.wishlistButton}
          disabled={toggleWishlist.isPending}
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          onPress={handleWishlistToggle}
        >
          <Text style={[styles.wishlistIcon, wishlisted && styles.wishlistIconOn]}>
            {wishlisted ? '♥' : '♡'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {product.isVeg != null && (
          <Badge label={product.isVeg ? 'Veg' : 'Non-veg'} tone={product.isVeg ? 'success' : 'danger'} />
        )}
        <Text style={styles.name}>{product.name}</Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
        <Text style={styles.store}>Sold by {product.store.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{variant?.price ?? product.basePrice}</Text>
          {variant?.mrp && variant.mrp > variant.price && (
            <Text style={styles.mrp}>₹{variant.mrp}</Text>
          )}
        </View>

        {product.description && <Text style={styles.description}>{product.description}</Text>}

        {inDifferentStoreCart && (
          <Text style={styles.warning}>
            Your cart has items from a different store. Adding this will start a new cart.
          </Text>
        )}
        {error && <Text style={styles.warning}>{error}</Text>}

        <Button
          label={variant && variant.availableQty <= 0 ? 'Out of stock' : 'Add to cart'}
          onPress={handleAdd}
          loading={addItem.isPending}
          disabled={!variant || variant.availableQty <= 0}
        />
        <Button label="View cart" variant="secondary" onPress={() => router.push('/cart')} />
        <Button
          label="Compare prices at nearby stores"
          variant="secondary"
          onPress={() => router.push({ pathname: '/compare/[productId]', params: { productId: product.id } })}
        />

        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          storeName={product.store.name}
          storeRatingAvg={product.store.ratingAvg}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 32 },
  image: { width: '100%', height: 260 },
  imagePlaceholder: { backgroundColor: '#e2e8f0' },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistIcon: { fontSize: 20, color: '#64748b', lineHeight: 24 },
  wishlistIconOn: { color: '#dc2626' },
  body: { padding: 16, gap: 8 },
  name: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  brand: { fontSize: 13, color: '#64748b' },
  store: { fontSize: 13, color: '#64748b' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontSize: 20, fontWeight: '700', color: '#2E5E4E' },
  mrp: { fontSize: 14, color: '#94a3b8', textDecorationLine: 'line-through' },
  description: { fontSize: 14, color: '#334155', lineHeight: 20, marginTop: 8 },
  warning: { fontSize: 13, color: '#b45309', marginTop: 4 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
