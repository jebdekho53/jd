'use client';

import { useState, useEffect } from 'react';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { useProfileQuery, useUpdateProfileMutation } from '@/features/profile/hooks/use-profile';

export function ProfileEditContent() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.displayName);
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  if (isLoading) {
    return (
      <ProfileShell title="Edit profile">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-xl bg-cream-3" />
          <div className="h-12 rounded-xl bg-cream-3" />
        </div>
      </ProfileShell>
    );
  }

  if (isError || !profile) {
    return (
      <ProfileShell title="Edit profile">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title="Edit profile" subtitle="Update your personal details">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate(
            { displayName: name.trim(), email: email.trim() || null },
            { onSuccess: () => window.history.back() },
          );
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-jd-text-muted">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-jd-text-muted">Phone</span>
          <input
            disabled
            value={profile.phone}
            className="w-full rounded-xl border border-border/40 bg-cream-3 px-3 py-2.5 text-sm text-jd-text-muted"
          />
          <p className="mt-1 text-xs text-jd-text-muted">Change phone in Security settings</p>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-jd-text-muted">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </ProfileShell>
  );
}
