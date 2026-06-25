'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { AddressCard } from '@/features/profile/components/address-card';
import { AddressForm } from '@/features/profile/components/address-form';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { EmptyState } from '@/components/common/state-blocks';
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '@/features/profile/hooks/use-addresses';
import type { ProfileAddress } from '@/features/profile/types';

export function ProfileAddressesContent() {
  const { data: addresses, isLoading, isError, refetch } = useAddressesQuery();
  const createMutation = useCreateAddressMutation();
  const updateMutation = useUpdateAddressMutation();
  const deleteMutation = useDeleteAddressMutation();
  const setDefaultMutation = useSetDefaultAddressMutation();
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<ProfileAddress | null>(null);

  if (isLoading) {
    return (
      <ProfileShell title="Saved addresses" subtitle="Manage delivery locations">
        <ProfileListSkeleton rows={2} />
      </ProfileShell>
    );
  }

  if (isError) {
    return (
      <ProfileShell title="Saved addresses">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  if (mode === 'add') {
    return (
      <ProfileShell title="Add address" backHref="/profile/addresses">
        <AddressForm
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: () => setMode('list'),
            });
          }}
          onCancel={() => setMode('list')}
          isPending={createMutation.isPending}
        />
      </ProfileShell>
    );
  }

  if (mode === 'edit' && editing) {
    return (
      <ProfileShell title="Edit address" backHref="/profile/addresses">
        <AddressForm
          initial={editing}
          onSubmit={(data) => {
            updateMutation.mutate(
              { id: editing.id, patch: data },
              { onSuccess: () => { setMode('list'); setEditing(null); } },
            );
          }}
          onCancel={() => { setMode('list'); setEditing(null); }}
          isPending={updateMutation.isPending}
        />
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title="Saved addresses" subtitle={`${addresses?.length ?? 0} saved`}>
      <button
        type="button"
        onClick={() => setMode('add')}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add new address
      </button>

      {!addresses?.length ? (
        <EmptyState
          variant="default"
          title="No addresses saved"
          description="Add your home or work address for faster checkout."
          actionLabel="Add address"
          onAction={() => setMode('add')}
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((addr) => (
            <li key={addr.id}>
              <AddressCard
                address={addr}
                onEdit={() => { setEditing(addr); setMode('edit'); }}
                onDelete={() => {
                  if (confirm('Delete this address?')) {
                    deleteMutation.mutate(addr.id);
                  }
                }}
                onSetDefault={() => setDefaultMutation.mutate(addr.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </ProfileShell>
  );
}
