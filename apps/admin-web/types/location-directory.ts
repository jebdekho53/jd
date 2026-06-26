export interface MasterLocationPincode {
  id: string;
  label: string;
  slug: string;
  type: string;
  pincode?: string;
  postOffice?: string;
  city: string;
  citySlug: string;
  area?: string;
  areaSlug?: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  deliveryRegion: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
  isActive?: boolean;
}

export interface MasterLocationListResult {
  total: number;
  page: number;
  limit: number;
  items: MasterLocationPincode[];
}

export interface MasterLocationStats {
  totals: {
    states: number;
    districts: number;
    cities: number;
    areas: number;
    pincodes: number;
    aliases: number;
    activePincodes: number;
  };
  regions: { deliveryRegion: string; _count: { _all: number } }[];
  cityBreakdown: {
    id: string;
    name: string;
    slug: string;
    _count: { areas: number; pincodes: number };
  }[];
}

export interface MasterLocationFilters {
  states: { id: string; name: string; code: string; slug: string }[];
  districts: { id: string; name: string; slug: string; stateId: string }[];
  cities: { id: string; name: string; slug: string; districtId: string; stateId: string }[];
}

export interface ListMasterLocationsParams {
  q?: string;
  cityId?: string;
  districtId?: string;
  pincode?: string;
  page?: number;
  limit?: number;
}

export interface ImportLocationsResult {
  imported: number;
}
