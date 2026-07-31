import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDrawerStore } from '@/store/drawer-store';
import { useIsAuthenticated, useLogoutMutation } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  danger: '#dc2626',
  border: '#e5e7eb',
};

const DRAWER_WIDTH = Math.min(300, Dimensions.get('window').width * 0.8);

interface DrawerLink {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: Href;
}

const SHOP_LINKS: DrawerLink[] = [
  { icon: 'pricetag-outline', label: 'Offers & deals', href: '/offers' },
  { icon: 'ribbon-outline', label: 'JebDekho Plus', href: '/plus' },
  { icon: 'heart-outline', label: 'Wishlist', href: '/wishlist' },
  { icon: 'wallet-outline', label: 'Wallet', href: '/wallet' },
];

const ACCOUNT_LINKS: DrawerLink[] = [
  { icon: 'notifications-outline', label: 'Notifications', href: '/profile/inbox' },
  { icon: 'gift-outline', label: 'Refer & earn', href: '/profile/referrals' },
  { icon: 'trophy-outline', label: 'Loyalty rewards', href: '/profile/rewards' },
  { icon: 'settings-outline', label: 'Settings', href: '/profile/settings' },
];

const SUPPORT_LINKS: DrawerLink[] = [
  { icon: 'help-circle-outline', label: 'Help & support', href: '/profile/support' },
  { icon: 'document-text-outline', label: 'Terms of service', href: '/legal/terms' },
  { icon: 'shield-checkmark-outline', label: 'Privacy policy', href: '/legal/privacy' },
  { icon: 'information-circle-outline', label: 'About JebDekho', href: '/legal/about' },
];

/** Slide-in hamburger drawer for secondary destinations, reachable from any
 *  tab's header without leaving the current screen. Built with plain
 *  Animated/Modal rather than @react-navigation/drawer to avoid pulling in a
 *  new nav-library dependency just for this. Mounted once near the app root
 *  (see app/_layout.tsx) so it overlays every screen. */
export function SideDrawer() {
  const open = useDrawerStore((s) => s.open);
  const setOpen = useDrawerStore((s) => s.setOpen);
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const profile = useProfile();
  const logout = useLogoutMutation();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, translateX, backdropOpacity]);

  const close = () => setOpen(false);

  const go = (href: Href) => {
    close();
    router.push(href);
  };

  const confirmLogout = () => {
    close();
    Alert.alert('Log out?', 'You will need your phone number and an OTP to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => logout.mutate(undefined, { onSettled: () => router.replace('/login') }),
      },
    ]);
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <Animated.View style={[styles.drawer, { width: DRAWER_WIDTH, transform: [{ translateX }] }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.displayName ?? 'G').charAt(0).toUpperCase()}
              </Text>
            </View>
            {profile ? (
              <Pressable onPress={() => go('/profile')} style={{ flex: 1 }}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile.displayName}
                </Text>
                <Text style={styles.profilePhone}>{profile.phone}</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>Welcome</Text>
                <Pressable onPress={() => go('/login')}>
                  <Text style={styles.loginLink}>Login / Sign up</Text>
                </Pressable>
              </View>
            )}
            <Pressable onPress={close} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.linksContent} showsVerticalScrollIndicator={false}>
            <DrawerSection title="Shop" links={SHOP_LINKS} onPress={go} />
            <DrawerSection title="Account" links={ACCOUNT_LINKS} onPress={go} />
            <DrawerSection title="Support" links={SUPPORT_LINKS} onPress={go} />

            {isAuthenticated && (
              <Pressable style={styles.logoutRow} onPress={confirmLogout} disabled={logout.isPending}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
                <Text style={styles.logoutText}>
                  {logout.isPending ? 'Logging out…' : 'Log out'}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerSection({
  title,
  links,
  onPress,
}: {
  title: string;
  links: DrawerLink[];
  onPress: (href: Href) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {links.map((link) => (
        <Pressable key={link.href.toString()} style={styles.linkRow} onPress={() => onPress(link.href)}>
          <Ionicons name={link.icon} size={19} color={COLORS.primary} style={styles.linkIcon} />
          <Text style={styles.linkText}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  drawer: {
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  loginLink: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2, textDecorationLine: 'underline' },

  linksContent: { paddingVertical: 8 },
  section: { paddingHorizontal: 10, marginTop: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
    marginLeft: 8,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 11 },
  linkIcon: { width: 22 },
  linkText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginHorizontal: 18,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc262640',
    backgroundColor: '#dc26260d',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
});
