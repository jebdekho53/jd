import type { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'marker'];

export const DEFAULT_MAP_CENTER = { lat: 28.6139, lng: 77.209 } as const;

export const DEFAULT_MAP_ZOOM = 15;

export function isGoogleMapsConfigured(): boolean {
  return GOOGLE_MAPS_API_KEY.trim().length > 0;
}

export function warnIfGoogleMapsMissing(context = 'app'): void {
  if (typeof window === 'undefined') return;
  if (!isGoogleMapsConfigured()) {
    console.warn(
      `[${context}] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing — using master directory fallback`,
    );
  }
}
