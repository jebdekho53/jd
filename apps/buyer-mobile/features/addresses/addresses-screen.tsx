import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useUpdateAddressMutation,
} from '@/hooks/use-addresses';
import { AddressForm } from '@/features/addresses/address-form';
import { AddressCard } from '@/features/addresses/address-card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import type { BuyerAddress } from '@/types/address';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
};

export function AddressesScreen() {
  const { data: addresses, isLoading, isError, refetch } = useAddressesQuery();
  const createAddress = useCreateAddressMutation();
  const updateAddress = useUpdateAddressMutation();
  const deleteAddress = useDeleteAddressMutation();
  const setDefault = useSetDefaultAddressMutation();

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<BuyerAddress | null>(null);

  const closeForm = () => {
    setMode('list');
    setEditing(null);
    createAddress.reset();
    updateAddress.reset();
  };

  if (mode === 'add') {
    return (
      <AddressForm
        submitting={createAddress.isPending}
        error={createAddress.error ? (createAddress.error as Error).message : null}
        onCancel={closeForm}
        onSubmit={(payload) => createAddress.mutate(payload, { onSuccess: closeForm })}
      />
    );
  }

  if (mode === 'edit' && editing) {
    return (
      <AddressForm
        initial={editing}
        submitting={updateAddress.isPending}
        error={updateAddress.error ? (updateAddress.error as Error).message : null}
        onCancel={closeForm}
        onSubmit={(payload) =>
          updateAddress.mutate({ id: editing.id, patch: payload }, { onSuccess: closeForm })
        }
      />
    );
  }

  if (isLoading) return <Loader fullScreen />;

  if (isError) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>Could not load your addresses</Text>
        <Button label="Retry" variant="secondary" onPress={() => refetch()} />
      </View>
    );
  }

  const handleDelete = (address: BuyerAddress) => {
    Alert.alert('Delete this address?', `${address.line1}, ${address.city}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress.mutate(address.id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{addresses?.length ?? 0} saved</Text>

      <Pressable style={styles.addButton} onPress={() => setMode('add')}>
        <Text style={styles.addButtonText}>＋ Add new address</Text>
      </Pressable>

      {!addresses?.length ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>No addresses saved</Text>
          <Text style={styles.stateText}>Add your home or work address for faster checkout.</Text>
        </View>
      ) : (
        addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={() => {
              setEditing(address);
              setMode('edit');
            }}
            onDelete={() => handleDelete(address)}
            onSetDefault={() => setDefault.mutate(address.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },

  addButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2E5E4E66',
    backgroundColor: '#2E5E4E0d',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  stateWrap: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  stateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  stateText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
