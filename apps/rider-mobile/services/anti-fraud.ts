import { haversineKm } from '@/utils/distance';

const MAX_SPEED_KMH = 120;
const TELEPORT_KM = 5;
const TELEPORT_SEC = 30;
const MAX_ACCEPT_REJECT_PER_HOUR = 20;

interface PositionSample {
  lat: number;
  lng: number;
  at: number;
}

interface ActionSample {
  orderId: string;
  action: string;
  at: number;
}

let lastSample: PositionSample | null = null;
const recentActions: ActionSample[] = [];

export interface FraudCheckResult {
  allowed: boolean;
  reason?: string;
  flags: string[];
}

export function checkLocationAnomaly(
  lat: number,
  lng: number,
  accuracy: number | null,
): FraudCheckResult {
  const flags: string[] = [];
  const now = Date.now();

  if (accuracy != null && accuracy > 200) {
    flags.push('LOW_ACCURACY');
  }

  if (lastSample) {
    const elapsedSec = (now - lastSample.at) / 1000;
    if (elapsedSec > 0) {
      const distKm = haversineKm(lastSample.lat, lastSample.lng, lat, lng);
      const speedKmh = (distKm / elapsedSec) * 3600;

      if (speedKmh > MAX_SPEED_KMH) {
        flags.push('SPEED_ANOMALY');
        return {
          allowed: false,
          reason: `Speed anomaly detected (${Math.round(speedKmh)} km/h)`,
          flags,
        };
      }

      if (distKm > TELEPORT_KM && elapsedSec < TELEPORT_SEC) {
        flags.push('TELEPORT');
        return {
          allowed: false,
          reason: 'Location teleport detected',
          flags,
        };
      }
    }
  }

  lastSample = { lat, lng, at: now };
  return { allowed: true, flags };
}

export function checkActionAbuse(orderId: string, action: string): FraudCheckResult {
  const now = Date.now();
  const hourAgo = now - 3_600_000;

  while (recentActions.length && recentActions[0].at < hourAgo) {
    recentActions.shift();
  }

  recentActions.push({ orderId, action, at: now });

  const acceptReject = recentActions.filter(
    (a) => a.action === 'accept' || a.action === 'reject',
  );

  if (acceptReject.length > MAX_ACCEPT_REJECT_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Too many accept/decline actions — try again later',
      flags: ['ACTION_ABUSE'],
    };
  }

  return { allowed: true, flags: [] };
}

export function isStaleTransition(clientTimestamp: number): boolean {
  return Date.now() - clientTimestamp > 120_000;
}

export function resetFraudState() {
  lastSample = null;
  recentActions.length = 0;
}
