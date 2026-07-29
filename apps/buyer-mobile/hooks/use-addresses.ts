import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from '@/services/buyer-api';
import type { BuyerAddress, UpsertAddressPayload } from '@/types/address';

export const addressKeys = {
  list: ['addresses', 'list'] as const,
};

export function useAddressesQuery() {
  return useQuery({ queryKey: addressKeys.list, queryFn: listAddresses, staleTime: 60_000 });
}

/** The API returns them default-first, so the head of the list is the one
 *  checkout should preselect. */
export function useDefaultAddress(): BuyerAddress | undefined {
  const { data } = useAddressesQuery();
  return data?.find((a) => a.isDefault) ?? data?.[0];
}

export function useCreateAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertAddressPayload) => createAddress(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.list }),
  });
}

export function useUpdateAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<UpsertAddressPayload> }) =>
      updateAddress(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.list }),
  });
}

export function useDeleteAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.list }),
  });
}

/** Promoting one address clears `isDefault` on the others server-side. */
export function useSetDefaultAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateAddress(id, { isDefault: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.list }),
  });
}
