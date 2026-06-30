'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { listUsers } from '@/services/admin-api';
import type { UserRole } from '@/types/user';

const ROLE_LABELS: Record<string, string> = {
  BUYER: 'Buyer',
  MERCHANT: 'Merchant',
  RIDER: 'Rider',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super admin',
};

export function UsersPageContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role')?.toUpperCase() as UserRole | undefined;
  const roleLabel = role ? ROLE_LABELS[role] ?? role : 'Platform';
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', role, search],
    queryFn: () => listUsers({ role, search: search.trim() || undefined, limit: 50 }),
  });

  const users = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{roleLabel} user directory</h2>
        <p className="text-sm text-slate-500">
          {role ? `Filtered to ${roleLabel.toLowerCase()} accounts.` : 'All platform users.'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Email or phone"
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading users...</p>}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load users.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No users match this view.
        </p>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{user.email ?? 'No email'}</p>
                    <p className="text-xs text-slate-500">{user.id}</p>
                  </td>
                  <td className="px-4 py-3">{user.phone}</td>
                  <td className="px-4 py-3">{user.roles.join(', ')}</td>
                  <td className="px-4 py-3">{user.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.meta && (
            <p className="border-t px-4 py-2 text-xs text-slate-500">
              Showing {users.length} of {data.meta.total} users
            </p>
          )}
        </div>
      )}
    </div>
  );
}
