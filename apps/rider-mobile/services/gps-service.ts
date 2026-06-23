import * as Location from 'expo-location';
import { pushLocation, postGpsQuality, RiderApiError } from '@/services/rider-api';
import { useLocationStore } from '@/store/location-store';
import { useRiderStore } from '@/store/rider-store';
import { enqueueOffline, flushOfflineQueue } from '@/services/offline-queue';
import { uid } from '@/lib/uid';
import { checkLocationAnomaly } from '@/services/anti-fraud';
import { log } from '@/services/logger';

const MOVING_INTERVAL_MS = 6_000;
const IDLE_INTERVAL_MS = 20_000;
const BATTERY_IDLE_INTERVAL_MS = 30_000;
const MAX_ACCURACY_M = 200;
const HEALTH_INTERVAL_MS = 120_000;

let watchSub: Location.LocationSubscription | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;
let lastSentAt = 0;
let lastLat: number | null = null;
let lastLng: number | null = null;
let lastMoveAt = Date.now();
let pausedForAccuracy = false;
let rawLat: number | null = null;
let rawLng: number | null = null;
let rawAccuracy: number | null = null;

function isMoving(lat: number, lng: number): boolean {
  if (lastLat == null || lastLng == null) return true;
  const moved = Math.abs(lat - lastLat) > 0.00008 || Math.abs(lng - lastLng) > 0.00008;
  if (moved) lastMoveAt = Date.now();
  return moved || Date.now() - lastMoveAt < 45_000;
}

function currentInterval(moving: boolean, onDelivery: boolean): number {
  if (!moving) return onDelivery ? IDLE_INTERVAL_MS : BATTERY_IDLE_INTERVAL_MS;
  return onDelivery ? MOVING_INTERVAL_MS : MOVING_INTERVAL_MS + 2_000;
}

function shouldSend(lat: number, lng: number, minInterval: number): boolean {
  const now = Date.now();
  if (now - lastSentAt < minInterval) return false;
  if (lastLat != null && lastLng != null) {
    const moved =
      Math.abs(lat - lastLat) > 0.00003 || Math.abs(lng - lastLng) > 0.00003;
    if (!moved && now - lastSentAt < minInterval * 2) return false;
  }
  return true;
}

async function sendLocation(lat: number, lng: number, accuracy: number | null) {
  const fraud = checkLocationAnomaly(lat, lng, accuracy);
  if (!fraud.allowed) {
    log('GPS_UPDATE', 'Blocked suspicious location', { reason: fraud.reason, flags: fraud.flags });
    return;
  }

  const payload = {
    latitude: lat,
    longitude: lng,
    accuracy: accuracy ?? undefined,
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

function reportGpsHealth() {
  void postGpsQuality({
    accuracy: rawAccuracy,
    isTracking: Boolean(watchSub),
    pausedForAccuracy,
    latitude: rawLat,
    longitude: rawLng,
    lastSyncedAt: useLocationStore.getState().lastSyncedAt,
  }).catch(() => {
    /* best effort */
  });
}

async function handlePosition(loc: Location.LocationObject) {
  const { latitude, longitude } = loc.coords;
  const accuracy = loc.coords.accuracy;

  rawLat = latitude;
  rawLng = longitude;
  rawAccuracy = accuracy ?? null;

  if (accuracy != null && accuracy > MAX_ACCURACY_M) {
    if (!pausedForAccuracy) {
      pausedForAccuracy = true;
      log('GPS_UPDATE', 'Paused sends — low accuracy', { accuracy });
    }
    useLocationStore.getState().setPosition(latitude, longitude, accuracy);
    return;
  }

  if (pausedForAccuracy) {
    pausedForAccuracy = false;
    log('GPS_UPDATE', 'Resumed sends — accuracy improved', { accuracy });
  }

  useLocationStore.getState().setPosition(latitude, longitude, accuracy);

  const onDelivery = useRiderStore.getState().availability === 'ON_DELIVERY';
  const moving = isMoving(latitude, longitude);
  const interval = currentInterval(moving, onDelivery);

  if (!shouldSend(latitude, longitude, interval)) return;

  try {
    await sendLocation(latitude, longitude, accuracy);
  } catch {
    /* queued */
  }
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;
  await Location.requestBackgroundPermissionsAsync();
  return true;
}

export async function startGpsTracking() {
  const availability = useRiderStore.getState().availability;
  if (availability === 'OFFLINE') return;

  const ok = await requestLocationPermissions();
  if (!ok) return;

  if (watchSub) return;

  const onDelivery = availability === 'ON_DELIVERY';
  const moving = rawLat != null && rawLng != null;
  const interval = currentInterval(moving, onDelivery);

  watchSub = await Location.watchPositionAsync(
    {
      accuracy: onDelivery ? Location.Accuracy.Balanced : Location.Accuracy.Low,
      timeInterval: interval,
      distanceInterval: onDelivery ? 8 : 15,
    },
    (loc) => {
      void handlePosition(loc);
    },
  );

  if (!healthTimer) {
    healthTimer = setInterval(reportGpsHealth, HEALTH_INTERVAL_MS);
    reportGpsHealth();
  }

  useLocationStore.getState().setTracking(true);
}

export function stopGpsTracking() {
  watchSub?.remove();
  watchSub = null;
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
  useLocationStore.getState().setTracking(false);
}

export async function syncOfflineLocations() {
  await flushOfflineQueue(async (item) => {
    if (item.type === 'location') {
      await pushLocation(item.payload as unknown as Parameters<typeof pushLocation>[0]);
      useLocationStore.getState().dequeue(item.id);
    }
  });
}

export function syncGpsWithAvailability() {
  const availability = useRiderStore.getState().availability;
  if (availability === 'OFFLINE') {
    stopGpsTracking();
  } else {
    void startGpsTracking();
  }
}
