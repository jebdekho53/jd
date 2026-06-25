'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  MapPin,
  Heart,
  Wallet,
  Clock,
  XCircle,
  RotateCcw,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  Settings,
  Gift,
  Award,
  FileText,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { StatCard } from '@/features/profile/components/stat-card';
import { MenuSection } from '@/features/profile/components/menu-section';
import { MenuRow } from '@/features/profile/components/menu-row';
import { LogoutModal } from '@/features/profile/components/logout-modal';
import { ProfileSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import {
  useProfileQuery,
  useProfileStatsQuery,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
} from '@/features/profile/hooks/use-profile';
import { useLogoutFlow } from '@/features/profile/hooks/use-logout-flow';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export function ProfileDashboardContent() {
  const router = useRouter();
  const profileQuery = useProfileQuery();
  const statsQuery = useProfileStatsQuery();
  const uploadAvatar = useUploadAvatarMutation();
  const removeAvatar = useRemoveAvatarMutation();
  const logoutFlow = useLogoutFlow();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(
    (file: File) => {
      setUploadError(null);
      uploadAvatar.mutate(file, {
        onError: (err) => setUploadError(err instanceof Error ? err.message : 'Upload failed'),
      });
    },
    [uploadAvatar],
  );

  const handleConfirmLogout = useCallback(async () => {
    await logoutFlow.confirmLogout();
    useAuthStore.getState().clearSession();
    window.location.href = '/';
  }, [logoutFlow]);

  if (profileQuery.isLoading) {
    return (
      <PageShell>
        <ProfileSkeleton />
      </PageShell>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageShell>
        <ProfileErrorState onRetry={() => profileQuery.refetch()} />
      </PageShell>
    );
  }

  const profile = profileQuery.data;
  const stats = statsQuery.data;

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl space-y-5 md:max-w-3xl">
        <ProfileHeader
          profile={profile}
          onUpload={handleUpload}
          onRemoveAvatar={() => removeAvatar.mutate()}
          onEdit={() => router.push('/profile/edit')}
          isUploading={uploadAvatar.isPending || removeAvatar.isPending}
        />
        {uploadError && (
          <p className="text-center text-sm text-destructive" role="alert">
            {uploadError}
          </p>
        )}

        <section aria-labelledby="account-overview">
          <h2 id="account-overview" className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
            Account overview
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total orders"
              value={stats?.totalOrders ?? '—'}
              href="/orders"
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              label="Addresses"
              value={stats?.savedAddresses ?? 0}
              href="/profile/addresses"
              icon={<MapPin className="h-5 w-5" />}
            />
            <StatCard
              label="Wishlist"
              value={stats?.wishlistCount ?? 0}
              href="/profile/wishlist"
              icon={<Heart className="h-5 w-5" />}
            />
            <StatCard
              label="Wallet"
              value={formatCurrency(stats?.walletBalance ?? 0)}
              sublabel="View wallet"
              href="/wallet"
              icon={<Wallet className="h-5 w-5" />}
            />
          </div>
        </section>

        <MenuSection title="Order center">
          <MenuRow icon={Package} title="Order history" subtitle="View all past orders" href="/orders" />
          <MenuRow icon={Clock} title="Active orders" subtitle="Track ongoing deliveries" href="/orders?status=active" />
          <MenuRow icon={XCircle} title="Cancelled orders" subtitle="Orders you cancelled" href="/orders?status=cancelled" />
          <MenuRow icon={RotateCcw} title="Returns & refunds" subtitle="Manage returns" href="/profile/support" badge="Help" />
        </MenuSection>

        <MenuSection title="Account">
          <MenuRow icon={MapPin} title="Address management" subtitle="Home, work & more" href="/profile/addresses" />
          <MenuRow icon={Heart} title="Wishlist" subtitle="Saved products" href="/profile/wishlist" />
          <MenuRow icon={CreditCard} title="Payment methods" subtitle="UPI, cards & net banking" href="/profile/payments" />
          <MenuRow icon={Bell} title="Notifications" subtitle="Orders, offers & delivery" href="/profile/notifications" />
          <MenuRow icon={Shield} title="Security" subtitle="Sessions & account safety" href="/profile/security" />
        </MenuSection>

        <MenuSection title="Rewards">
          <MenuRow icon={Gift} title="Refer & earn" subtitle="Invite friends, earn rewards" href="/profile/referrals" />
          <MenuRow icon={Award} title="Loyalty rewards" subtitle={`${stats?.loyaltyPoints ?? 0} points`} href="/profile/rewards" />
        </MenuSection>

        <MenuSection title="Support & legal">
          <MenuRow icon={HelpCircle} title="Help & support" subtitle="FAQs, contact & report issue" href="/profile/support" />
          <MenuRow icon={FileText} title="Terms of service" href="/terms" />
          <MenuRow icon={FileText} title="Privacy policy" href="/privacy" />
          <MenuRow icon={FileText} title="Refund policy" href="/refund-policy" />
        </MenuSection>

        <MenuSection title="Preferences">
          <MenuRow icon={Settings} title="Settings" subtitle="Dark mode, language & location" href="/profile/settings" />
        </MenuSection>

        <button
          type="button"
          onClick={logoutFlow.requestLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
          <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />
        </button>
      </div>

      <LogoutModal
        open={logoutFlow.open}
        onCancel={logoutFlow.cancelLogout}
        onConfirm={handleConfirmLogout}
        isPending={logoutFlow.isPending}
      />
    </PageShell>
  );
}
