export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recordedAt: string;
}

export interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface QueuedLocationUpdate extends LocationUpdatePayload {
  id: string;
  queuedAt: string;
}

export type LocationTrackingMode = 'high' | 'balanced' | 'low';
