'use client';

import { useState } from 'react';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { MenuSection } from '@/features/profile/components/menu-section';
import { MenuRow } from '@/features/profile/components/menu-row';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import {
  useLoginSessionsQuery,
  useLogoutAllDevicesMutation,
} from '@/features/profile/hooks/use-preferences';
import { Smartphone, Phone, Trash2, LogOut } from 'lucide-react';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';

export function ProfileSecurityContent() {
  const { data: profile } = useProfileQuery();
  const { data: sessions, isLoading, isError, refetch } = useLoginSessionsQuery();
  const logoutAll = useLogoutAllDevicesMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <ProfileShell title="Security">
        <ProfileListSkeleton rows={2} />
      </ProfileShell>
    );
  }

  if (isError) {
    return (
      <ProfileShell title="Security">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title="Security" subtitle="Protect your account">
      <MenuSection title="Login sessions">
        <ul className="space-y-2">
          {sessions?.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-jd-text-primary">{session.deviceName}</p>
                <p className="text-xs text-jd-text-muted">
                  {session.isCurrent ? 'Current session' : `Last active ${new Date(session.lastActive).toLocaleDateString()}`}
                </p>
              </div>
              {session.isCurrent && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Active
                </span>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => logoutAll.mutate()}
          disabled={logoutAll.isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 py-2.5 text-sm font-semibold text-jd-text-primary hover:bg-cream-3 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {logoutAll.isPending ? 'Logging out…' : 'Log out all other devices'}
        </button>
      </MenuSection>

      <MenuSection title="Account access" className="mt-6">
        <MenuRow
          icon={Phone}
          title="Change phone number"
          subtitle={profile?.phone ?? 'Verify new number via OTP'}
          onClick={() => alert('Phone change flow coming soon')}
        />
      </MenuSection>

      <MenuSection title="Danger zone" className="mt-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">Delete account</h3>
          <p className="mt-1 text-xs text-jd-text-muted">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-white"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete my account
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-border/60 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => alert('Account deletion will be available when backend support is added')}
                className="flex-1 rounded-xl bg-destructive py-2 text-xs font-semibold text-white"
              >
                Confirm delete
              </button>
            </div>
          )}
        </div>
      </MenuSection>
    </ProfileShell>
  );
}
