import type { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/**
 * Optional Google Maps Map ID for vector map styling. Prefer
 * NEXT_PUBLIC_GOOGLE_MAP_ID; keep NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID as a
 * backwards-compatible alias for existing deployments.
 */
export const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ||
  '';

export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'marker'];

export const MAP_INITIAL_VISUAL_CENTER = { lat: 20.5937, lng: 78.9629 } as const;

export const DEFAULT_MAP_ZOOM = 15;

export function isGoogleMapsConfigured(): boolean {
  return GOOGLE_MAPS_API_KEY.trim().length > 0;
}

export function warnIfGoogleMapsMissing(context = 'app'): void {
  if (typeof window === 'undefined') return;
  if (!isGoogleMapsConfigured()) {
    console.warn(
      `[${context}] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing — Google Maps location selection is disabled`,
    );
  }
}
