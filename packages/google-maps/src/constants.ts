import type { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/**
 * A Map ID is required for Advanced Markers. Set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
 * to a Map ID created in the Google Cloud console for production styling;
 * falls back to Google's DEMO_MAP_ID so markers render without extra setup.
 */
export const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID';

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
