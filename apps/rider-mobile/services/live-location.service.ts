/**
 * Live location engine — adaptive GPS tracking for active deliveries.
 * Intervals: 8–15s when moving, pauses when OFFLINE/SUSPENDED.
 */
import * as Location from 'expo-location';
import { pushLocation, postGpsQuality, RiderApiError } from '@/services/rider-api';
import { useLocationStore } from '@/store/location-store';
import { useRiderStore } from '@/store/rider-store';
import { enqueueOffline, flushOfflineQueue } from '@/services/offline-queue';
import { uid } from '@/lib/uid';
import { checkLocationAnomaly } from '@/services/anti-fraud';
import { log } from '@/services/logger';

const MIN_INTERVAL_MS = 8_000;
const MAX_INTERVAL_MS = 15_000;
const IDLE_INTERVAL_MS = 20_000;
const MIN_MOVE_METERS = 50;
const MAX_ACCURACY_M = 200;
const HEALTH_INTERVAL_MS = 120_000;

/** ~50m in degrees at equator */
const MOVE_THRESHOLD = 0.00045;

let watchSub: Location.LocationSubscription | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;
let lastSentAt = 0;
let lastLat: number | null = null;
let lastLng: number | null = null;
let pausedForAccuracy = false;

function shouldTrack(): boolean {
  const availability = useRiderStore.getState().availability;
  if (availability === 'OFFLINE') return false;
  return ['ONLINE', 'ON_DELIVERY', 'BUSY'].includes(availability);
}

function movedEnough(lat: number, lng: number): boolean {
  if (lastLat == null || lastLng == null) return true;
  const dLat = Math.abs(lat - lastLat);
  const dLng = Math.abs(lng - lastLng);
  return dLat > MOVE_THRESHOLD || dLng > MOVE_THRESHOLD;
}

function intervalForState(onDelivery: boolean): number {
  return onDelivery ? MIN_INTERVAL_MS : MAX_INTERVAL_MS;
}

async function sendLocation(
  lat: number,
  lng: number,
  accuracy: number | null,
  heading?: number | null,
  speed?: number | null,
) {
  const fraud = checkLocationAnomaly(lat, lng, accuracy);
  if (!fraud.allowed) {
    log('GPS_UPDATE', 'Blocked suspicious location', { reason: fraud.reason });
    return;
  }

  const payload = {
    latitude: lat,
    longitude: lng,
    accuracy: accuracy ?? undefined,
    heading: heading ?? undefined,
    speed: speed ?? undefined,
  };

  try {
    await pushLocation(payload);
    useLocationStore.getState().setSynced(new Date().toISOString());
    lastSentAt = Date.now();
    lastLat = lat;
    lastLng = lng;
    log('GPS_UPDATE', 'Location synced', { accuracy });
  } catch (err) {
    if (err instanceof RiderApiError && (err.status === 0 || err.status >= 500)) {
      await enqueueOffline({ type: 'location', payload });
      useLocationStore.getState().enqueue({
        id: uid(),
        queuedAt: new Date().toISOString(),
        ...payload,
      });
    }
    throw err;
  }
}

async function handlePosition(loc: Location.LocationObject) {
  const { latitude, longitude, accuracy, heading, speed } = loc.coords;

  if (accuracy != null && accuracy > MAX_ACCURACY_M) {
    pausedForAccuracy = true;
    useLocationStore.getState().setPosition(latitude, longitude, accuracy);
    return;
  }
  pausedForAccuracy = false;
  useLocationStore.getState().setPosition(latitude, longitude, accuracy);

  const onDelivery = useRiderStore.getState().availability === 'ON_DELIVERY';
  const minInterval = intervalForState(onDelivery);
  const now = Date.now();

  if (now - lastSentAt < minInterval && !movedEnough(latitude, longitude)) return;

  try {
    await sendLocation(latitude, longitude, accuracy, heading, speed);
  } catch {
    /* queued offline */
  }
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;
  await Location.requestBackgroundPermissionsAsync();
  return true;
}

export async function startLiveLocationTracking() {
  if (!shouldTrack()) return;

  const ok = await requestLocationPermissions();
  if (!ok || watchSub) return;

  const onDelivery = useRiderStore.getState().availability === 'ON_DELIVERY';

  watchSub = await Location.watchPositionAsync(
    {
      accuracy: onDelivery ? Location.Accuracy.Balanced : Location.Accuracy.Low,
      timeInterval: onDelivery ? MIN_INTERVAL_MS : MAX_INTERVAL_MS,
      distanceInterval: MIN_MOVE_METERS,
    },
    (loc) => {
      void handlePosition(loc);
    },
  );

  if (!healthTimer) {
    healthTimer = setInterval(() => {
      void postGpsQuality({
        accuracy: null,
        isTracking: Boolean(watchSub),
        pausedForAccuracy,
        lastSyncedAt: useLocationStore.getState().lastSyncedAt,
      }).catch(() => undefined);
    }, HEALTH_INTERVAL_MS);
  }

  useLocationStore.getState().setTracking(true);
}

export function stopLiveLocationTracking() {
  watchSub?.remove();
  watchSub = null;
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
  useLocationStore.getState().setTracking(false);
}

export function syncLiveLocationWithAvailability() {
  if (!shouldTrack()) {
    stopLiveLocationTracking();
  } else {
    void startLiveLocationTracking();
  }
}

export async function syncOfflineLocations() {
  await flushOfflineQueue(async (item) => {
    if (item.type === 'location') {
      await pushLocation(item.payload as Parameters<typeof pushLocation>[0]);
      useLocationStore.getState().dequeue(item.id);
    }
  });
}

// Backward-compatible aliases for existing imports
export const startGpsTracking = startLiveLocationTracking;
export const stopGpsTracking = stopLiveLocationTracking;
export const syncGpsWithAvailability = syncLiveLocationWithAvailability;
