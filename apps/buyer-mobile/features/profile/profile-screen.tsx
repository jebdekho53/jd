import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useProfile } from '@/hooks/use-profile';
import { useLogoutMutation } from '@/hooks/use-auth';
import { useWalletQuery } from '@/hooks/use-wallet';
import { useAddressesQuery } from '@/hooks/use-addresses';
import { useWishlistQuery } from '@/hooks/use-wishlist';
import { useOrdersListQuery } from '@/hooks/use-orders';
import { Loader } from '@/components/ui/loader';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  danger: '#dc2626',
};

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  href: Href;
}

export function ProfileScreen() {
  const router = useRouter();
  const profile = useProfile();
  const logout = useLogoutMutation();
  const { data: wallet } = useWalletQuery();
  const { data: addresses } = useAddressesQuery();
  const { data: wishlist } = useWishlistQuery();
  const { data: orders } = useOrdersListQuery();

  if (!profile) return <Loader fullScreen />;

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Orders',
      items: [
        { icon: '📦', title: 'Order history', subtitle: 'All past orders', href: '/orders' },
        { icon: '🔄', title: 'Returns & refunds', subtitle: 'Get help', href: '/profile/support' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: '📍', title: 'Addresses', subtitle: 'Delivery locations', href: '/profile/addresses' },
        { icon: '♡', title: 'Wishlist', subtitle: 'Saved products', href: '/wishlist' },
        { icon: '🔔', title: 'Notifications', subtitle: 'Order & delivery updates', href: '/profile/inbox' },
        {
          icon: '⚙️',
          title: 'Notification preferences',
          subtitle: 'Channels & alert types',
          href: '/profile/notifications',
        },
        { icon: '🛡️', title: 'Security', subtitle: 'Sessions & safety', href: '/profile/security' },
      ],
    },
    {
      title: 'Rewards',
      items: [
        { icon: '💰', title: 'Wallet', subtitle: 'Balance & transactions', href: '/wallet' },
        { icon: '🎁', title: 'Refer & earn', subtitle: 'Invite friends', href: '/profile/referrals' },
        {
          icon: '🏅',
          title: 'Loyalty rewards',
          subtitle: `${wallet?.rewardPoints ?? 0} points available`,
          href: '/profile/rewards',
        },
        { icon: '⭐', title: 'JebDekho Plus', subtitle: 'Free delivery & more', href: '/plus' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', title: 'Help & support', subtitle: 'Tickets & FAQs', href: '/profile/support' },
        { icon: '📄', title: 'Terms of service', href: '/legal/terms' },
        { icon: '📄', title: 'Privacy policy', href: '/legal/privacy' },
        { icon: '📄', title: 'Refund policy', href: '/legal/refund-policy' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔧', title: 'Settings', subtitle: 'Location & app info', href: '/profile/settings' },
      ],
    },
  ];

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need your phone number and an OTP to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () =>
          logout.mutate(undefined, {
            onSettled: () => router.replace('/login'),
          }),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.phone}>
            {profile.phone}
            {profile.phoneVerified ? ' · Verified' : ''}
          </Text>
          {profile.email ? <Text style={styles.email}>{profile.email}</Text> : null}
        </View>
        <Pressable onPress={() => router.push('/profile/edit')}>
          <Text style={styles.editLink}>Edit</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>OVERVIEW</Text>
      <View style={styles.statGrid}>
        <StatCard
          label="Orders"
          value={String(orders?.meta?.total ?? orders?.orders.length ?? 0)}
          onPress={() => router.push('/orders')}
        />
        <StatCard
          label="Addresses"
          value={String(addresses?.length ?? 0)}
          onPress={() => router.push('/profile/addresses')}
        />
        <StatCard
          label="Wishlist"
          value={String(wishlist?.length ?? 0)}
          onPress={() => router.push('/wishlist')}
        />
        <StatCard
          label="Wallet"
          value={`₹${(wallet?.balance ?? 0).toFixed(0)}`}
          onPress={() => router.push('/wallet')}
        />
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, index) => (
              <Pressable
                key={item.title + item.href}
                style={[styles.menuRow, index > 0 && styles.menuRowDivided]}
                onPress={() => router.push(item.href)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable style={styles.logoutButton} onPress={confirmLogout} disabled={logout.isPending}>
        <Text style={styles.logoutText}>{logout.isPending ? 'Logging out…' : 'Log out'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  email: { fontSize: 12, color: COLORS.textMuted },
  editLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted },

  menuSection: { gap: 8 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  menuRowDivided: { borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  menuIcon: { fontSize: 17, width: 24, textAlign: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  menuChevron: { fontSize: 22, color: '#cbd5e1' },

  logoutButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dc262640',
    backgroundColor: '#dc26260d',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
});
