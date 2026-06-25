import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/features/profile/services/address-service';
import type { UpsertAddressInput } from '@/features/profile/types';

export const addressKeys = {
  all: ['profile', 'addresses'] as const,
  list: () => [...addressKeys.all, 'list'] as const,
};

export function useAddressesQuery() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: fetchAddresses,
    staleTime: 30_000,
  });
}

export function useCreateAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertAddressInput) => createAddress(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });
    },
  });
}

export function useUpdateAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<UpsertAddressInput> }) =>
      updateAddress(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });
    },
  });
}

export function useSetDefaultAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}
