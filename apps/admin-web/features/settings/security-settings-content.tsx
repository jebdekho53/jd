'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Shield, User } from 'lucide-react';
import { Button, Input, PasswordInput, useToast } from '@/design-system';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import {
  useAdminSessionsQuery,
  useAdminSettingsQuery,
  useChangePasswordMutation,
  useLogoutAllMutation,
  useRevokeSessionMutation,
  useUpdateAdminSettingsMutation,
} from '@/hooks/use-auth';

export function SecuritySettingsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAdminSettingsQuery();
  const { data: sessions } = useAdminSessionsQuery();
  const updateSettings = useUpdateAdminSettingsMutation();
  const changePassword = useChangePasswordMutation();
  const revokeSession = useRevokeSessionMutation();
  const logoutAll = useLogoutAllMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.name ?? '');
      setEmail(settings.email ?? '');
      setPhone(settings.phone ?? '');
    }
  }, [settings]);

  const handleSaveAccount = async () => {
    try {
      await updateSettings.mutateAsync({ name, email, phone });
      toast('Account settings updated', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast('Password changed. Please sign in again.', 'success');
      router.replace('/login');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll.mutateAsync();
      toast('Logged out from all devices', 'success');
      router.replace('/login');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (isLoading) {
    return (
      <DashboardShell title="Security Settings">
        <p className="text-sm text-slate-500">Loading settings…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Security Settings">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Account */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-admin-700" />
            <h2 className="text-lg font-semibold text-slate-900">Account Settings</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {settings?.lastLoginAt && (
            <p className="mt-3 text-xs text-slate-500">
              Last login: {new Date(settings.lastLoginAt).toLocaleString()}
            </p>
          )}
          <Button className="mt-4" loading={updateSettings.isPending} onClick={handleSaveAccount}>
            Save account
          </Button>
        </section>

        {/* Change password */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-admin-700" />
            <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Changing your password will sign you out of all devices.
          </p>
          <div className="grid gap-4">
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button className="mt-4" loading={changePassword.isPending} onClick={handleChangePassword}>
            Update password
          </Button>
        </section>

        {/* Sessions */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-admin-700" />
              <h2 className="text-lg font-semibold text-slate-900">Active Sessions</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={logoutAll.isPending}
              onClick={handleLogoutAll}
            >
              Logout all devices
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {(sessions ?? []).length === 0 ? (
              <p className="py-4 text-sm text-slate-500">No active sessions</p>
            ) : (
              sessions?.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{s.deviceName ?? 'Unknown device'}</p>
                    <p className="text-slate-500">
                      {s.ipAddress ?? 'Unknown IP'} · Last active{' '}
                      {new Date(s.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={revokeSession.isPending}
                    onClick={() =>
                      revokeSession.mutate(s.id, {
                        onSuccess: () => toast('Session revoked', 'success'),
                        onError: (err) => toast(err.message, 'error'),
                      })
                    }
                  >
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
