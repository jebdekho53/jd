import { Stack } from 'expo-router';

/**
 * Browsing (home/search/store/product/compare/offers/cart) works without
 * login. Screens that need an account (checkout, orders, profile, wallet,
 * wishlist, plus, the whole food vertical) wrap themselves in <AuthGuard>
 * individually instead of gating the entire app here.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E5E4E' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="store/[slug]" options={{ title: 'Store' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
      <Stack.Screen name="category/[slug]" options={{ title: 'Category' }} />
      <Stack.Screen name="location" options={{ title: 'Set delivery location' }} />
      <Stack.Screen name="compare/[productId]" options={{ title: 'Compare prices' }} />
      <Stack.Screen name="offers" options={{ title: 'Offers & deals' }} />
      <Stack.Screen name="plus" options={{ title: 'JebDekho Plus' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Order' }} />
      <Stack.Screen name="restaurants" options={{ title: 'Food' }} />
      <Stack.Screen name="restaurant/[slug]" options={{ title: 'Restaurant' }} />
      <Stack.Screen name="food-cart" options={{ title: 'Food Cart' }} />
      <Stack.Screen name="food-checkout" options={{ title: 'Food Checkout' }} />
      <Stack.Screen name="wishlist" options={{ title: 'Wishlist' }} />
      <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="profile/addresses" options={{ title: 'Saved Addresses' }} />
      <Stack.Screen name="profile/rewards" options={{ title: 'Loyalty Rewards' }} />
      <Stack.Screen name="profile/referrals" options={{ title: 'Refer & Earn' }} />
      <Stack.Screen name="profile/inbox" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile/notifications" options={{ title: 'Notification Preferences' }} />
      <Stack.Screen name="profile/security" options={{ title: 'Security' }} />
      <Stack.Screen name="profile/settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="profile/support/index" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="profile/support/[id]" options={{ title: 'Ticket' }} />
      <Stack.Screen name="legal/about" options={{ title: 'About' }} />
      <Stack.Screen name="legal/contact" options={{ title: 'Contact' }} />
      <Stack.Screen name="legal/faq" options={{ title: 'Help & FAQs' }} />
      <Stack.Screen name="legal/privacy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="legal/terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="legal/refund-policy" options={{ title: 'Refund Policy' }} />
      <Stack.Screen name="legal/data-deletion" options={{ title: 'Data Deletion' }} />
    </Stack>
  );
}
