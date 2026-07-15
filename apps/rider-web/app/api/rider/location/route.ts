import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth, getAccessToken } from '@/lib/auth/session';

const lastLocations = new Map<string, { lat: number; lng: number; at: number }>();
const MAX_SPEED_KMH = 120;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, accuracy } = body as {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid coordinates', code: 'VALIDATION_ERROR' },
        { status: 422 },
      );
    }

    if (accuracy != null && accuracy > 200) {
      return NextResponse.json(
        { success: false, message: 'GPS accuracy too low', code: 'LOW_ACCURACY' },
        { status: 422 },
      );
    }

    const riderKey = (await getAccessToken(req)) ?? req.headers.get('authorization') ?? 'anon';
    const prev = lastLocations.get(riderKey);
    const now = Date.now();

    if (prev) {
      const elapsedSec = (now - prev.at) / 1000;
      if (elapsedSec > 0) {
        const distKm = haversineKm(prev.lat, prev.lng, latitude, longitude);
        const speedKmh = (distKm / elapsedSec) * 3600;
        if (speedKmh > MAX_SPEED_KMH) {
          return NextResponse.json(
            {
              success: false,
              message: 'Suspicious location update rejected',
              code: 'SPEED_ANOMALY',
            },
            { status: 422 },
          );
        }
      }
    }

    lastLocations.set(riderKey, { lat: latitude, lng: longitude, at: now });

    const data = await fetchWithAuth(
      '/rider/location',
      { method: 'PATCH', body: JSON.stringify(body) },
      req,
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
