/** Matches the Prisma `AddressLabel` enum the API validates against — note
 *  buyer-web types these as 'Home' | 'Work' | 'Other', which the DTO's
 *  @IsEnum would reject. */
export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

/** Mirrors GeospatialService.serializeAddress in apps/api. */
export interface BuyerAddress {
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

/** `state` is required by CreateAddressDto but the service falls back to the
 *  state resolved from the pincode when it is an empty string. */
export interface UpsertAddressPayload {
  label?: AddressLabel;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}
