import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartQuery } from '@/hooks/use-cart';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { useGuestCartStore } from '@/store/guest-cart-store';
import { HamburgerButton } from '@/components/navigation/hamburger-button';

const COLORS = {
  primary: '#2E5E4E',
  inactive: '#9CA3AF',
};

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon(name: IoniconName, focusedName: IoniconName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );
}

/** Bottom tab bar for the 5 primary destinations — mirrors what most
 *  shopping apps put one tap away. Everything else (offers, wallet, help,
 *  legal pages, sign out…) lives in the hamburger drawer, opened from the
 *  headerLeft button on every tab, so it's reachable without leaving
 *  whichever tab you're on. Group folder name "(tabs)" is invisible in the
 *  URL, so /home, /categories, /cart, /orders, /profile are unchanged. */
export default function TabsLayout() {
  const isAuthenticated = useIsAuthenticated();
  const { data: cart } = useCartQuery();
  const guestItems = useGuestCartStore((s) => s.items);
  const cartCount = isAuthenticated
    ? (cart?.itemCount ?? 0)
    : guestItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: () => <HamburgerButton />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'JebDekho',
          tabBarLabel: 'Home',
          tabBarIcon: TabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="categories/index"
        options={{
          title: 'Categories',
          tabBarLabel: 'Categories',
          tabBarIcon: TabIcon('grid-outline', 'grid'),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarIcon: TabIcon('cart-outline', 'cart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#F59E0B', fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'My Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: TabIcon('receipt-outline', 'receipt'),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: TabIcon('person-outline', 'person'),
        }}
      />
    </Tabs>
  );
}
