import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAddressesQuery, useCreateAddressMutation } from '@/hooks/use-addresses';
import { AddressCard } from '@/features/addresses/address-card';
import { AddressForm } from '@/features/addresses/address-form';
import { Card } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import type { BuyerAddress } from '@/types/address';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
};

/**
 * Delivery-address block for both checkouts. Preselects the buyer's default
 * saved address and lets them switch or add one inline, replacing the one-off
 * manual form the checkouts used to carry.
 */
export function CheckoutAddressPicker({
  selected,
  onSelect,
}: {
  selected: BuyerAddress | null;
  onSelect: (address: BuyerAddress) => void;
}) {
  const router = useRouter();
  const { data: addresses, isLoading } = useAddressesQuery();
  const createAddress = useCreateAddressMutation();
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);

  // Preselect the default once the list arrives, and re-sync if the selected
  // address is edited or deleted elsewhere.
  useEffect(() => {
    if (!addresses?.length) return;
    const stillExists = selected && addresses.some((a) => a.id === selected.id);
    if (!stillExists) {
      onSelect(addresses.find((a) => a.isDefault) ?? addresses[0]);
    }
  }, [addresses, selected, onSelect]);

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Loader />
      </Card>
    );
  }

  if (!addresses?.length) {
    return (
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery address</Text>
        <Text style={styles.emptyText}>
          You have no saved addresses yet. Add one to continue.
        </Text>
        <Pressable style={styles.addButton} onPress={() => setAdding(true)}>
          <Text style={styles.addButtonText}>＋ Add an address</Text>
        </Pressable>
        <AddFormModal
          visible={adding}
          submitting={createAddress.isPending}
          error={createAddress.error ? (createAddress.error as Error).message : null}
          onCancel={() => {
            setAdding(false);
            createAddress.reset();
          }}
          onSubmit={(payload) =>
            createAddress.mutate(payload, {
              onSuccess: (created) => {
                setAdding(false);
                onSelect(created);
              },
            })
          }
        />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Delivery address</Text>
        <Pressable onPress={() => setPicking(true)}>
          <Text style={styles.changeText}>Change</Text>
        </Pressable>
      </View>

      {selected ? (
        <AddressCard address={selected} />
      ) : (
        <Text style={styles.emptyText}>Choose where this order should go.</Text>
      )}

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose an address</Text>
            <Pressable onPress={() => setPicking(false)}>
              <Text style={styles.changeText}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                selected={selected?.id === address.id}
                onPress={() => {
                  onSelect(address);
                  setPicking(false);
                }}
              />
            ))}
            <Pressable
              style={styles.addButton}
              onPress={() => {
                setPicking(false);
                setAdding(true);
              }}
            >
              <Text style={styles.addButtonText}>＋ Add a new address</Text>
            </Pressable>
            <Pressable
              style={styles.manageLink}
              onPress={() => {
                setPicking(false);
                router.push('/profile/addresses');
              }}
            >
              <Text style={styles.manageLinkText}>Manage saved addresses</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <AddFormModal
        visible={adding}
        submitting={createAddress.isPending}
        error={createAddress.error ? (createAddress.error as Error).message : null}
        onCancel={() => {
          setAdding(false);
          createAddress.reset();
        }}
        onSubmit={(payload) =>
          createAddress.mutate(payload, {
            onSuccess: (created) => {
              setAdding(false);
              onSelect(created);
            },
          })
        }
      />
    </Card>
  );
}

function AddFormModal({
  visible,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  submitting: boolean;
  error: string | null;
} & Pick<React.ComponentProps<typeof AddressForm>, 'onSubmit' | 'onCancel'>) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <AddressForm submitting={submitting} error={error} onSubmit={onSubmit} onCancel={onCancel} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  changeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  emptyText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  addButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2E5E4E66',
    backgroundColor: '#2E5E4E0d',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  sheet: { flex: 1, backgroundColor: '#f8fafc' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  sheetContent: { padding: 16, gap: 12 },
  manageLink: { alignItems: 'center', paddingVertical: 8 },
  manageLinkText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
});
