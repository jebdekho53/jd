export const DUPLICATE_COVERAGE_MESSAGE =
  'This pincode is already in your delivery coverage.';

export interface CoverageLocationSelection {
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface CoverageAddState {
  pincode: string;
  isValid: boolean;
  alreadyAdded: boolean;
  canAdd: boolean;
  message?: string;
}

export function normalizeCoveragePincode(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();
  return /^\d{6}$/.test(trimmed) ? trimmed : '';
}

export function parseUniqueCoveragePincodes(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[\s,]+/)
        .map((pincode) => normalizeCoveragePincode(pincode))
        .filter(Boolean),
    ),
  ];
}

export function splitCoveragePincodes(
  pincodes: string[],
  existingPincodes: Set<string>,
): { alreadyAdded: string[]; readyToAdd: string[] } {
  const alreadyAdded: string[] = [];
  const readyToAdd: string[] = [];

  for (const pincode of pincodes) {
    if (existingPincodes.has(pincode)) alreadyAdded.push(pincode);
    else readyToAdd.push(pincode);
  }

  return { alreadyAdded, readyToAdd };
}

export function getCoverageAddState(
  pincode: string | null | undefined,
  existingPincodes: Set<string>,
): CoverageAddState {
  const normalized = normalizeCoveragePincode(pincode);
  const alreadyAdded = normalized ? existingPincodes.has(normalized) : false;
  return {
    pincode: normalized,
    isValid: Boolean(normalized),
    alreadyAdded,
    canAdd: Boolean(normalized) && !alreadyAdded,
    message: alreadyAdded ? DUPLICATE_COVERAGE_MESSAGE : undefined,
  };
}

export function friendlyCoverageErrorMessage(status: number, fallback?: string): string {
  if (status === 409) return DUPLICATE_COVERAGE_MESSAGE;
  return fallback || 'Could not update delivery coverage. Please try again.';
}

export function updateCoverageSelectionFromMap(
  current: Partial<CoverageLocationSelection>,
  next: Partial<CoverageLocationSelection>,
): CoverageLocationSelection {
  return {
    locality: next.locality ?? current.locality ?? '',
    city: next.city ?? current.city ?? '',
    state: next.state ?? current.state ?? '',
    pincode: normalizeCoveragePincode(next.pincode) || '',
    lat: next.lat ?? current.lat ?? 0,
    lng: next.lng ?? current.lng ?? 0,
  };
}
