import { buyerFetch } from '@/services/api/buyer-auth-client';
import type { ApiResponse } from '@/types/buyer';
import type { AddressLabel, ProfileAddress, UpsertAddressInput } from '@/features/profile/types';

/** Wire shape returned by GeospatialService.serializeAddress (apps/api). */
interface BackendAddress {
  id: string;
  label: AddressLabel;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

function fromBackend(a: BackendAddress): ProfileAddress {
  return {
    id: a.id,
    label: a.label,
    line1: a.line1,
    line2: a.line2 ?? undefined,
    landmark: a.landmark ?? undefined,
    pincode: a.pincode,
    city: a.city,
    lat: a.latitude,
    lng: a.longitude,
    isDefault: a.isDefault,
    createdAt: '',
  };
}

function toBackendPayload(input: Partial<UpsertAddressInput>) {
  return {
    label: input.label,
    line1: input.line1,
    line2: input.line2,
    landmark: input.landmark,
    city: input.city,
    // CreateAddressDto requires `state` as a string (not optional) — an empty
    // string still satisfies that and lets the service fall back to the state
    // resolved from the pincode lookup (`dto.state || validated.state`).
    state: '',
    pincode: input.pincode,
    latitude: input.lat,
    longitude: input.lng,
    isDefault: input.isDefault,
  };
}

export async function listAddressesRemote(): Promise<ProfileAddress[]> {
  const res = await buyerFetch<ApiResponse<BackendAddress[]>>('/api/buyer/addresses');
  return res.data.map(fromBackend);
}

export async function createAddressRemote(input: UpsertAddressInput): Promise<ProfileAddress> {
  const res = await buyerFetch<ApiResponse<BackendAddress>>('/api/buyer/addresses', {
    method: 'POST',
    body: JSON.stringify(toBackendPayload(input)),
  });
  return fromBackend(res.data);
}

export async function updateAddressRemote(
  id: string,
  patch: Partial<UpsertAddressInput>,
): Promise<ProfileAddress> {
  const res = await buyerFetch<ApiResponse<BackendAddress>>(`/api/buyer/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toBackendPayload(patch)),
  });
  return fromBackend(res.data);
}

export async function deleteAddressRemote(id: string): Promise<void> {
  await buyerFetch<ApiResponse<{ deleted: boolean }>>(`/api/buyer/addresses/${id}`, {
    method: 'DELETE',
  });
}
